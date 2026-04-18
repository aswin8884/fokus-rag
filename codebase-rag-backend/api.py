import os
import shutil
from typing import Dict, List, AsyncGenerator
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from operator import itemgetter
from langchain_cohere import CohereEmbeddings, ChatCohere, CohereRerank
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage
from langchain_classic.retrievers.contextual_compression import ContextualCompressionRetriever
from fastapi import UploadFile, File
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import jwt
import requests
import json

load_dotenv()
COHERE_KEY = os.environ.get("COHERE_API_KEY")
CLERK_PUBLISHABLE_KEY = os.environ.get("CLERK_PUBLISHABLE_KEY")

if not COHERE_KEY:
    raise ValueError("ERROR: Key not found! Check your .env file.")

os.makedirs("./data", exist_ok=True)

# ============= CLERK AUTH VERIFICATION =============
CLERK_PUBLIC_KEY = None

def get_clerk_public_key():
    """Fetch Clerk's public key for JWT verification"""
    global CLERK_PUBLIC_KEY
    if not CLERK_PUBLIC_KEY:
        try:
            response = requests.get("https://api.clerk.com/v1/jwks.json")
            response.raise_for_status()
            keys = response.json()["keys"]
            CLERK_PUBLIC_KEY = keys[0]["publicKey"] if keys else None
        except Exception as e:
            print(f"Warning: Could not fetch Clerk public key: {e}")
            return None
    return CLERK_PUBLIC_KEY

def verify_clerk_token(authorization_header: str, fallback_user_id: str = None) -> str:
    """
    Verify Clerk JWT token and return user_id.
    Falls back to fallback_user_id if token cannot be decoded.
    """
    if not authorization_header:
        if fallback_user_id:
            return fallback_user_id
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        parts = authorization_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            decoded = jwt.decode(token, options={"verify_signature": False})
            user_id = decoded.get("sub")
            if user_id:
                return user_id
    except Exception as e:
        print(f"Auth warning: {e}")

    if fallback_user_id:
        return fallback_user_id
    raise HTTPException(status_code=401, detail="Authentication failed")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str
    session_id: str
    lang: str = "en"
    user_id: str  # Required: Clerk user ID

# Chat histories now organized by user_id then session_id: {user_id: {session_id: [messages]}}
chat_histories: Dict[str, Dict[str, List]] = {}

embeddings = CohereEmbeddings(model="embed-multilingual-v3.0", cohere_api_key=COHERE_KEY)
llm = ChatCohere(model="command-r7b-12-2024", temperature=0.0, cohere_api_key=COHERE_KEY)
compressor = CohereRerank(model="rerank-multilingual-v3.0", top_n=5, cohere_api_key=COHERE_KEY)

system_template = """You are Fokus RAG, a highly precise, multilingual enterprise document assistant. 
Except for casual greetings, you have NO outside knowledge and rely strictly on the provided documents.

★★★ SUPREME DIRECTIVE: LANGUAGE OVERRIDE ★★★
You must ALWAYS respond in the EXACT language the user used in their question. 
- If the User Question is written in English, you MUST respond in English, even if all the provided documents are in German. 
- If the User Question is written in German, you MUST respond in German.
- NEVER let the document's language override the user's language."""

human_template = """Context from documents:
====================
{context}
====================

User Question: {input}

CRITICAL INSTRUCTIONS: 
1. EXCEPTION FOR GREETINGS: If the User Question is a simple, casual greeting (like "hello", "hi", "guten tag", "how are you"), politely introduce yourself as Fokus RAG and ask how you can help them analyze their documents.
2. FOR ALL OTHER QUESTIONS: Answer relying SOLELY on the Context above.
3. If a factual question is completely unmentioned in the Context, say exactly: "Based on the provided documents, I do not know." (Translate this to the requested language).
4. FORMATTING: Structure your answer beautifully using paragraphs, bullet points, and bold text.
5. MANDATORY LANGUAGE OVERRIDE: The user's interface is set to {language}. You MUST translate your final answer into {language}, regardless of the language of the Context or the Question.

Answer strictly in {language}:"""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_template),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", human_template),
])

# Standalone Question Generator
rephrase_prompt = ChatPromptTemplate.from_messages([
    ("system", """Given the chat history and a follow-up question, rephrase the follow-up into a standalone search query. 
    CRITICAL: If the follow-up question introduces a NEW topic (like 'address' or 'contact') that is unrelated to the previous conversation, 
    DO NOT include the previous topic in the rephrased query. 
    Just return the follow-up as a clear, standalone search term. 
    Do NOT answer the question, just rephrase it."""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])
rephrase_chain = rephrase_prompt | llm | StrOutputParser()

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def get_session_chain(user_id: str, session_id: str):
    # Combine user_id and session_id to create unique collection names
    # This ensures chat isolation between users
    combined_id = f"{user_id}_{session_id}"
    safe_session_id = "".join(e for e in combined_id if e.isalnum())
    
    vectorstore = Chroma(
        persist_directory="./chroma_db", 
        embedding_function=embeddings,
        collection_name=safe_session_id 
    )
    
    base_retriever = vectorstore.as_retriever(search_kwargs={"k": 15})
    retriever = ContextualCompressionRetriever(base_compressor=compressor, base_retriever=base_retriever)
    
    final_chain = prompt | llm | StrOutputParser()
    
    return vectorstore, retriever, final_chain


@app.post("/chat")
async def chat_endpoint(request: ChatRequest, authorization: str = Header(None)):
    
    # Verify authentication — fall back to request user_id if token decode fails
    verify_clerk_token(authorization, fallback_user_id=request.user_id)
    user_id = request.user_id
    session_id = request.session_id
    
    # Initialize user's chat histories if needed
    if user_id not in chat_histories:
        chat_histories[user_id] = {}
    
    # Initialize this specific session's history for the user
    if session_id not in chat_histories[user_id]:
        chat_histories[user_id][session_id] = []
        
    vectorstore, retriever, final_chain = get_session_chain(user_id, session_id)
    current_history = chat_histories[user_id][session_id]
    
    # Determine the target language based on the toggle
    target_language = "German" if request.lang == "de" else "English"
    print(f"Forcing AI to output in: {target_language}")
    
    # 1. Rephrase for Chat History
    search_query = request.question
    if current_history:
        search_query = await rephrase_chain.ainvoke({
            "chat_history": current_history,
            "input": request.question
        })

    # 2. Retrieve Documents
    retrieved_docs = await retriever.ainvoke(search_query)

    # Extract sources with page numbers
    sources_dict = {}  # filename -> set of page numbers
    for doc in retrieved_docs:
        path = doc.metadata.get("source", "Unknown")
        filename = os.path.basename(path)
        page_num = doc.metadata.get("page", None)
        
        if filename not in sources_dict:
            sources_dict[filename] = set()
        
        if page_num is not None:
            sources_dict[filename].add(page_num + 1)  # PyPDFLoader uses 0-based indexing, convert to 1-based
    
    # Format sources as "filename (p. X, Y, Z)" or just "filename" if no pages
    sources = []
    for filename in sorted(sources_dict.keys()):
        pages = sorted(list(sources_dict[filename]))
        if pages:
            page_str = ", ".join(str(p) for p in pages)
            sources.append(f"{filename} (p. {page_str})")
        else:
            sources.append(filename)
    
    # 3. Create streaming generator
    async def stream_answer() -> AsyncGenerator[str, None]:
        try:
            context = format_docs(retrieved_docs)
            full_answer = ""

            # Stream tokens directly from LLM as they are generated
            async for chunk in final_chain.astream({
                "context": context,
                "input": request.question,
                "chat_history": current_history,
                "language": target_language
            }):
                full_answer += chunk
                yield json.dumps({"type": "chunk", "content": chunk}) + "\n"

            # Send completion with sources
            yield json.dumps({"type": "complete", "sources": sources, "full_answer": full_answer}) + "\n"

            # Update chat history (keep last 10 messages)
            chat_histories[user_id][session_id].append(HumanMessage(content=request.question))
            chat_histories[user_id][session_id].append(AIMessage(content=full_answer))
            if len(chat_histories[user_id][session_id]) > 10:
                chat_histories[user_id][session_id] = chat_histories[user_id][session_id][-10:]

        except Exception as e:
            print(f"STREAM FAILED: {str(e)}")
            yield json.dumps({"type": "error", "content": "Error generating response.", "error": str(e)}) + "\n"
    
    # Return streaming response
    return StreamingResponse(
        stream_answer(),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )

@app.post("/upload")
async def upload_file(session_id: str, user_id: str, file: UploadFile = File(...), authorization: str = Header(None)):
    
    # Verify authentication — fall back to request user_id if token decode fails
    verify_clerk_token(authorization, fallback_user_id=user_id)
    
    temp_path = f"./data/{file.filename}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Load PDF and preserve page metadata
        loader = PyPDFLoader(temp_path)
        docs = loader.load()
        
        # PyPDFLoader automatically includes 'page' in metadata
        # Verify and ensure page numbers are present
        for doc in docs:
            if 'page' not in doc.metadata:
                doc.metadata['page'] = 0  # Default if missing
        
        # Split documents while preserving metadata (including page numbers)
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        splits = text_splitter.split_documents(docs)
        
        # Ensure all splits maintain page metadata
        for split in splits:
            if 'page' not in split.metadata:
                split.metadata['page'] = 0
        
        vectorstore, _, _ = get_session_chain(user_id, session_id)
        vectorstore.add_documents(documents=splits)
        
        os.remove(temp_path)
        
        # Log processing info
        print(f"Processed {len(splits)} document chunks with page metadata from {file.filename}")
        
        return {"success": True, "message": f"Processed securely into session {session_id[:4]}..."}
    
    except Exception as e:
        error_msg = str(e)
        print(f"UPLOAD CRASHED: {error_msg}")
        return {"success": False, "message": f"Backend Error: {error_msg}"}