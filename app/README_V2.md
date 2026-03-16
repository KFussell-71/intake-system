# Intake System V2: Production Packaging

This version provides a self-contained, container-first architecture for the DOR Employment Services intake-system.

## Architecture

- **App**: Next.js (TypeScript) running in a Node.js container.
- **Backend-as-a-Service**: Local PostgreSQL (Supabase-compatible) for data persistence.
- **Clinical AI**: Local Ollama server for privacy-compliant summarization and analysis.
- **Edge Support**: PWA manifest configured for Android tablet installation.

## Installation

### Linux

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Windows

```powershell
.\scripts\setup.ps1
```

## Referencing V1

The previous cloud-first version is tagged as `v1-stable`. To switch back:

```bash
git checkout v1-stable
```

## Directory Structure

- `/app`: The core Next.js application codebase.
- `/docker`: Infrastructure orchestration logic.
- `/scripts`: Automated cross-platform installers.
- `/mobile`: Progressive Web App and mobile wrapper assets.
