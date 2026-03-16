# 🚀 Quickstart: Intake System V3

This guide gets you up and running with the full Docker-based production stack.

### 1. Prerequisites
- Docker & Docker Compose
- GitHub credentials (to pull the latest image/repo)
- `node` & `npm` (for local Prisma generation)

### 2. Environment Setup
Create your local environment file:
```bash
cp .env.example .env
```
Edit `.env` and provide:
- `DATABASE_URL` (Internal for Docker, but needed for Prisma CLI)
- `NEXTAUTH_SECRET` (Generate via `openssl rand -base64 32`)
- `GOOGLE_API_KEY` (For Gemini fallback)

### 3. Database Initialization
```bash
# Generate Prisma Client
npx prisma generate

# Finalize Schema
npx prisma migrate deploy
npx prisma db seed
```

### 4. Launch the Stack
```bash
# Power on all services (App, DB, Matrix, Ollama, VPNs)
docker compose -f docker-compose.nas.yml up -d --build
```
Access the UI at: `http://localhost:3000` (or `http://[NAS-IP]:8090` via Nginx).

---

## 🔍 Service Dashboard
- **Main App**: `http://localhost:3000`
- **Matrix (Element)**: `http://localhost:8091`
- **WireGuard UI**: `http://localhost:51821`
- **Observability (Grafana)**: `http://localhost:3001`
