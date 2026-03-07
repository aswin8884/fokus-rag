import os
import shutil
from git import Repo

# --- Configuration ---
# We will use a small, popular repo (FastAPI) for testing, but you can change this!
REPO_URL = "https://github.com/tiangolo/fastapi" 
LOCAL_DIR = "./repo_data"

# The file types we actually want the AI to read
SUPPORTED_EXTENSIONS = ['.py', '.js', '.ts', '.tsx', '.md']

# The junk folders we want to completely ignore to save memory
IGNORE_DIRS = ['.git', 'node_modules', 'venv', '__pycache__', 'dist', 'build', 'docs']

def clone_repository(repo_url, local_dir):
    """Clones a GitHub repo, wiping the local folder first if it already exists."""
    if os.path.exists(local_dir):
        print(f"📁 Directory '{local_dir}' exists. Deleting it for a fresh clone...")
        shutil.rmtree(local_dir)
        
    print(f"🚀 Cloning {repo_url} into {local_dir}...")
    Repo.clone_from(repo_url, local_dir)
    print("✅ Clone successful!")

def extract_files(local_dir):
    """Walks the folder tree, skips junk, and reads the code."""
    documents = []
    
    # os.walk goes through every folder and file inside LOCAL_DIR
    for root, dirs, files in os.walk(local_dir):
        # Modify the 'dirs' list in-place to skip our IGNORE_DIRS
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            # Check if the file ends with a supported extension
            if any(file.endswith(ext) for ext in SUPPORTED_EXTENSIONS):
                file_path = os.path.join(root, file)
                
                # Create a clean relative path (e.g., "src/main.py") for our metadata
                relative_path = os.path.relpath(file_path, local_dir)
                
                try:
                    # Open and read the file content
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Save the raw code and its location!
                    documents.append({
                        "page_content": content,
                        "metadata": {"source": relative_path}
                    })
                except Exception as e:
                    print(f"⚠️ Could not read {relative_path}: {e}")
                    
    return documents

# --- Run the Pipeline ---
if __name__ == "__main__":
    clone_repository(REPO_URL, LOCAL_DIR)
    docs = extract_files(LOCAL_DIR)
    
    print(f"\n🎯 Extraction Complete! Found {len(docs)} readable files.")
    if docs:
        print(f"📄 Example file captured: {docs[0]['metadata']['source']}")
        print(f"✂️  Length of this file: {len(docs[0]['page_content'])} characters")