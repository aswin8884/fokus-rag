import os
import shutil
from typing import Dict, List
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

load_dotenv()
COHERE_KEY = os.environ.get("COHERE_API_KEY")

if not COHERE_KEY:
    raise ValueError("ERROR: Key not found! Check your .env file.")

os.makedirs("./data", exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str
    session_id: str
    lang: str = "en"

chat_histories: Dict[str, List] = {}

embeddings = CohereEmbeddings(model="embed-multilingual-v3.0", cohere_api_key=COHERE_KEY)
llm = ChatCohere(model="command-r7b-12-2024", temperature=0.0, cohere_api_key=COHERE_KEY)
compressor = CohereRerank(model="rerank-multilingual-v3.0", top_n=10, cohere_api_key=COHERE_KEY)

system_template = """You are a highly precise, multilingual AI assistant. 
You have NO outside knowledge. You rely strictly on the provided documents.

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
1. Answer relying SOLELY on the Context above.
2. If the answer is completely unmentioned in the Context, say exactly: "Based on the provided documents, I do not know." (Translate this to the requested language).
3. FORMATTING: Structure your answer beautifully using paragraphs, bullet points, and bold text.
4. MANDATORY LANGUAGE OVERRIDE: The user's interface is set to {language}. You MUST translate your final answer into {language}, regardless of the language of the Context or the Question.

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

def get_session_chain(session_id: str):
    safe_session_id = "".join(e for e in session_id if e.isalnum())
    
    vectorstore = Chroma(
        persist_directory="./chroma_db", 
        embedding_function=embeddings,
        collection_name=safe_session_id 
    )
    
    base_retriever = vectorstore.as_retriever(search_kwargs={"k": 30})
    retriever = ContextualCompressionRetriever(base_compressor=compressor, base_retriever=base_retriever)
    
    final_chain = prompt | llm | StrOutputParser()
    
    return vectorstore, retriever, final_chain


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    
    session_id = request.session_id
    # Determine the target language based on the toggle
    target_language = "German" if request.lang == "de" else "English"
    print(f"Forcing AI to output in: {target_language}")
    
    if session_id not in chat_histories:
        chat_histories[session_id] = []
        
    vectorstore, retriever, final_chain = get_session_chain(session_id)
    current_history = chat_histories[session_id]
    
    # 1. Rephrase for Chat History
    search_query = request.question
    if current_history:
        search_query = rephrase_chain.invoke({
            "chat_history": current_history,
            "input": request.question
        })
    
    # 2. Retrieve Documents
    retrieved_docs = retriever.invoke(search_query)

    sources = []
    for doc in retrieved_docs:
        path = doc.metadata.get("source", "Unknown")
        filename = os.path.basename(path)
        if filename not in sources:
            sources.append(filename)
            
    # 3. Generate the Answer (FIXED LINE 144 BELOW)
    print("⏳ Generating raw answer from PDF...")
    try:
        raw_answer = final_chain.invoke({
            "context": format_docs(retrieved_docs),
            "input": request.question, 
            "chat_history": current_history,
            "language": target_language
        })
        print(f"🤖 RAW AI ANSWER: {raw_answer[:100]}...")
        
        # 4. Final Translation Guardrail
        print(f"⏳ Passing to Translation Guardrail ({target_language})...")
        translator_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a professional translator. You must perfectly translate the given text into {target_language}. Keep all Markdown formatting exactly as it is. Return ONLY the translated text, no other commentary."),
            ("human", "{text}")
        ])
        translator_chain = translator_prompt | llm | StrOutputParser()
        
        final_answer = translator_chain.invoke({
            "target_language": target_language,
            "text": raw_answer
        })
        
    except Exception as e:
        print(f"❌ CHAIN FAILED: {str(e)}")
        return {"answer": "Error generating response. Please check terminal.", "sources": []}

    print(f"✨ TRANSLATED ANSWER: {final_answer[:100]}...")
    print("="*50 + "\n")
    
    # Update History
    chat_histories[session_id].append(HumanMessage(content=request.question))
    chat_histories[session_id].append(AIMessage(content=final_answer))
    
    if len(chat_histories[session_id]) > 10:
        chat_histories[session_id] = chat_histories[session_id][-10:]
    
    return {"answer": final_answer, "sources": sources}

@app.post("/upload")
async def upload_file(session_id: str, file: UploadFile = File(...)):
    temp_path = f"./data/{file.filename}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        loader = PyPDFLoader(temp_path)
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        splits = text_splitter.split_documents(docs)
        
        vectorstore, _, _ = get_session_chain(session_id)
        vectorstore.add_documents(documents=splits)
        
        os.remove(temp_path)
        
        return {"success": True, "message": f"Processed securely into session {session_id[:4]}..."}
    
    except Exception as e:
        error_msg = str(e)
        print(f"UPLOAD CRASHED: {error_msg}")
        return {"success": False, "message": f"Backend Error: {error_msg}"}