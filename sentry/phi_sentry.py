import os
import re
import time
import json
import requests

# Logs directory to audit
LOG_DIR = "/app/logs"
MASKED_LOG_DIR = "/app/logs/masked"
OLLAMA_URL = "http://ollama:11434/api/generate"

# PHI Detection Patterns (Regex Tier)
PATTERNS = {
    "SSN": re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
    "DOB": re.compile(r'\b(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d\b'),
    "EMAIL": re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
}

def mask_with_nlp(content):
    """
    Semantic Shield: Use local Ollama to identify PHI that regex misses.
    """
    prompt = f"""
    Analyze the following log entry for PHI (Patient Health Information). 
    Identify specifically: Names, Addresses, and Phone Numbers.
    Return ONLY the text with [MASKED_NLP] replacing those specific items.
    Do not add any preamble.
    LOG ENTRY:
    {content}
    """
    try:
        response = requests.post(OLLAMA_URL, json={
            "model": "mistral", # or llama3/medllama
            "prompt": prompt,
            "stream": False
        }, timeout=10)
        
        if response.status_code == 200:
            return response.json().get("response", content).strip()
    except Exception as e:
        print(f"⚠️ NLP Shield Offline: {e}")
    return content

def mask_content(content):
    # Tier 1: Regex (Fast)
    masked = content
    for label, pattern in PATTERNS.items():
        masked = pattern.sub(f"[MASKED_{label}]", masked)
    
    # Tier 2: NLP (Semantic)
    # Only run NLP on lines that seem to contain narrative text to save tokens/GPU
    lines = masked.split('\n')
    shielded_lines = []
    for line in lines:
        if len(line) > 20 and not line.startswith('DEBUG'):
            shielded_lines.append(mask_with_nlp(line))
        else:
            shielded_lines.append(line)
            
    return '\n'.join(shielded_lines)

def audit_logs():
    os.makedirs(MASKED_LOG_DIR, exist_ok=True)
    print(f"🕵️  PHI Sentry v2 (Semantic) Active. Monitoring {LOG_DIR}...")
    
    seen_files = set()
    
    while True:
        try:
            for filename in os.listdir(LOG_DIR):
                if filename.endswith(".log") and filename not in seen_files:
                    path = os.path.join(LOG_DIR, filename)
                    masked_path = os.path.join(MASKED_LOG_DIR, f"masked_{filename}")
                    
                    print(f"🔍 Semantic Audit: {filename}")
                    with open(path, 'r') as f:
                        content = f.read()
                        
                    masked_content = mask_content(content)
                    
                    with open(masked_path, 'w') as f:
                        f.write(masked_content)
                    
                    seen_files.add(filename)
                    print(f"✅ Semantic Shield Applied: {masked_path}")
            
            time.sleep(15)
        except Exception as e:
            print(f"❌ Sentry v2 Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    # Wait for Ollama to be warm
    time.sleep(10)
    audit_logs()
