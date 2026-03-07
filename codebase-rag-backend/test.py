import os
import cohere
from dotenv import load_dotenv

# Load the key
load_dotenv()
key = os.environ.get("COHERE_API_KEY")

print("\n--- COHERE API KEY TEST ---")
if not key:
    print("❌ ERROR: Key is completely empty! Your .env file is missing or misnamed.")
else:
    print(f"🔍 Found key starting with: '{key[:5]}' and ending with: '{key[-3:]}'")
    print(f"📏 Length of key: {len(key)} characters")
    
    if key.startswith('"') or key.startswith("'"):
        print("❌ ERROR: You have quotes around your key in the .env file! Remove them.")
    else:
        print("⏳ Testing connection to Cohere servers...")
        try:
            # Try to send a single word to the embedding model
            co = cohere.Client(key)
            co.embed(texts=["hello"], model="embed-english-v3.0", input_type="search_query")
            print("✅ SUCCESS! Your API key is 100% valid and working.")
        except Exception as e:
            print(f"❌ FAILED: Cohere rejected the key. Error: {e}")
            print("👉 FIX: Log into dashboard.cohere.com, delete your old key, and generate a new one.")
print("---------------------------\n")