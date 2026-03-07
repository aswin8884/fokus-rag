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

chat_histories: Dict[str, List] = {}

embeddings = CohereEmbeddings(model="embed-multilingual-v3.0", cohere_api_key=COHERE_KEY)
llm = ChatCohere(model="command-r7b-12-2024", temperature=0.0, cohere_api_key=COHERE_KEY)

compressor = CohereRerank(model="rerank-multilingual-v3.0", top_n=10, cohere_api_key=COHERE_KEY)

system_template = """You are a highly precise, multilingual AI assistant. 
You have NO outside knowledge. You rely strictly on the provided documents."""

human_template = """Context from documents:
====================
{context}
====================

User Question: {input}

CRITICAL INSTRUCTIONS: 
1. Answer the question relying SOLELY on the Context above.
2. If the user asks "what is [term]" or asks about an acronym, and a strict definition is not found in the text, you must instead summarize everything the Context says ABOUT that term.
3. ONLY if the term is completely unmentioned in the Context, output this exact concept, translated into the user's language: "Based on the provided documents, I do not know."
4. MIRROR THE LANGUAGE: If they ask in English, reply in English. If they ask in German, reply in German.

Answer:"""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_template),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", human_template),
])

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
    
    rag_chain = (
        {
            "context": itemgetter("input") | retriever | format_docs, 
            "chat_history": itemgetter("chat_history"),
            "input": itemgetter("input")
        }
        | prompt | llm | StrOutputParser()
    )
    return vectorstore, retriever, rag_chain


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    session_id = request.session_id
    
    if session_id not in chat_histories:
        chat_histories[session_id] = []
        
    _, retriever, rag_chain = get_session_chain(session_id)
    
    retrieved_docs = retriever.invoke(request.question)

    # print(f"\n AI SEARCHED 30 CHUNKS AND KEPT {len(retrieved_docs)} FOR QUESTION: '{request.question}'")
    for i, doc in enumerate(retrieved_docs):
        print(f"--- CHUNK {i+1} ---")
        print(doc.page_content[:200] + "...\n") 
    
    sources = []
    for doc in retrieved_docs:
        path = doc.metadata.get("source", "Unknown")
        filename = os.path.basename(path)
        if filename not in sources:
            sources.append(filename)
    
    answer = rag_chain.invoke({
        "input": request.question,
        "chat_history": chat_histories[session_id]
    })
    
    chat_histories[session_id].append(HumanMessage(content=request.question))
    chat_histories[session_id].append(AIMessage(content=answer))
    
    if len(chat_histories[session_id]) > 10:
        chat_histories[session_id] = chat_histories[session_id][-10:]
    
    return {"answer": answer, "sources": sources}


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