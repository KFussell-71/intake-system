#!/bin/bash
# V3.1: Synthetic Health Probe
# Full-stack diagnostic check for the clinical intake platform.

echo "🔍 Starting Synthetic Health Probe V3.1..."

# 1. Proxy Check
if curl -s -k -f https://localhost/ > /dev/null; then
    echo "✅ PROXY: Nginx responding on port 443 (HTTPS)."
else
    echo "❌ PROXY: Port 443 unreachable or TLS error."
    exit 1
fi

# 2. Database Health
if docker exec intake-db pg_isready -U postgres > /dev/null; then
    echo "✅ DATABASE: Postgres healthy and accepting connections."
else
    echo "❌ DATABASE: Service down or not ready."
    exit 1
fi

# 3. AI Controller Probe (Lightweight)
if curl -s -k -f https://localhost/api/ai/api/tags > /dev/null; then
    echo "✅ AI: Ollama endpoint accessible through proxy."
else
    echo "⚠️  AI: Ollama unreachable or proxy misconfigured."
fi

# 4. Correlation Header check
C_ID=$(curl -s -k -I https://localhost/ | grep -i X-Request-ID)
if [ ! -z "$C_ID" ]; then
    echo "✅ TRACING: X-Request-ID present in response headers."
else
    echo "❌ TRACING: Correlation ID missing."
    exit 1
fi

echo "🎬 PROBE COMPLETE: V3.1 Enterprise Stack Operational."
