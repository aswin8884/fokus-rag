import os
from dotenv import load_dotenv 
from langchain_cohere import CohereEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 1. Configuration
# Load the hidden API key from your .env file
load_dotenv()

# Safety check to prevent the script from running if the key is missing
if not os.environ.get("COHERE_API_KEY"):
    raise ValueError("COHERE_API_KEY is missing! Please check your .env file.")

DATA_PATH = "./data"
CHROMA_PATH = "./chroma_db"

def build_database():
    # 2. Load Documents
    print("📂 Loading documents...")
    loader = DirectoryLoader(DATA_PATH, glob="./*.txt", loader_cls=TextLoader)
    documents = loader.load()
    
    # 3. Split Text
    # 2026 Standard: 1000 char chunks with 200 overlap for context retention
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)
    print(f"✂️ Split into {len(chunks)} chunks.")

    # 4. Embed and Store
    embeddings = CohereEmbeddings(model="embed-english-v3.0")
    
    print("🧠 Generating embeddings and saving to disk...")
    vectorstore = Chroma.from_documents(
        documents=chunks, 
        embedding=embeddings, 
        persist_directory=CHROMA_PATH
    )
    print(f"✅ Database built successfully at {CHROMA_PATH}")

if __name__ == "__main__":
    build_database()