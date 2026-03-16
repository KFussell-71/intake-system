#!/bin/bash
# 📦 Project Vanguard: Full Environment Export
# This script bundles the source code and the AI "Brain" context for portability.

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_NAME="vanguard_export_$TIMESTAMP.tar.gz"
TARGET_DIR="/home/kfussell/Documents/Intake"
BRAIN_DIR="/home/kfussell/.gemini/antigravity/brain/6ab48bc9-8b50-407f-956d-b2bbe387e67f"

echo "🚀 Starting Project Export: $EXPORT_NAME"

tar -czvf "$EXPORT_NAME" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.venv' \
    --exclude='dist' \
    --exclude='*.log' \
    -C /home/kfussell/Documents Intake \
    -C /home/kfussell/.gemini/antigravity/brain 6ab48bc9-8b50-407f-956d-b2bbe387e67f

echo "✅ Export Complete: $(pwd)/$EXPORT_NAME"
echo "📂 Contents: Intake/ (Source) + 6ab48bc9... (AI Brain Context)"
