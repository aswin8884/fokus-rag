# Use a lightweight, official Python image
FROM python:3.11-slim-bookworm

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies (ChromaDB needs this to build its math engine)
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Copy the requirements file first to cache the installations
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code into the container
COPY . .

# Create empty directories for your database and temporary uploads 
# so the cloud server can mount a persistent drive here later
RUN mkdir -p data chroma_db

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to boot up the server when the container starts
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]