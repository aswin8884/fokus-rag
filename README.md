# Fokus RAG | Enterprise Multilingual Document Assistant

Fokus RAG is a production-ready Retrieval-Augmented Generation (RAG) application designed to bridge the gap between English technical documentation and multilingual teams. It allows users to securely upload private PDFs and extract insights using natural language while ensuring high precision and zero hallucination.

## Key Features

- Multilingual Intelligence: Powered by Cohere Command-R. The system ingests English documents and responds in German or English.
- Zero-Hallucination Engineering: Strict prompt grounding ensures the AI refuses to answer if the information is not present in the source document.
- Two-Stage Retrieval: Uses vector embeddings for document search and a secondary processing layer for accurate information extraction.
- Modern Tech Stack: FastAPI backend with a responsive React (Vite) frontend.
- Secure Authentication: Clerk-based authentication for protected user sessions.

## Technical Stack

### Backend
- Language: Python 3.11
- Framework: FastAPI
- Orchestration: LangChain
- LLM: Cohere Command-R
- Vector Database: ChromaDB
- Deployment: Docker (Render)

### Frontend
- Library: React.js (Vite)
- Styling: Tailwind CSS and Lucide Icons
- Authentication: Clerk
- Deployment: Vercel

## Architecture

1. Ingestion: Uploaded PDFs are processed and split into optimized semantic chunks.
2. Embedding: Text chunks are converted into vector embeddings.
3. Vector Search: ChromaDB retrieves relevant document context based on the user query.
4. Generation: The LLM generates an answer strictly grounded on the retrieved context.

## Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/aswin8884/fokus-rag.git
cd fokus-rag
```

### 2. Backend Setup
```bash
cd codebase-rag-backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create a .env file and add
COHERE_API_KEY=your_api_key

python api.py
```

### 3. Frontend Setup
```bash
cd codebase-rag-frontend
npm install

# Create a .env file and add
VITE_CLERK_PUBLISHABLE_KEY=your_key
VITE_API_URL=http://localhost:8000

npm run dev
```

## License

Distributed under the MIT License.

## Author

Name: Aswin Pulickal  
Portfolio: https://aswin-pulickal-portfolio-five-nu-f3guxz8oby.vercel.app
LinkedIn: https://www.linkedin.com/in/aswin-pulickal-9aa4a42b0/
