#!/bin/bash
# R&D Program: Distributed Clinical Node - Forensic State Hash Proof (Docker Edition)
# Purpose: Generate a bit-identical SHA256 fingerprint of the current node state.

set -e

CONTAINER_NAME=${CONTAINER_NAME:-"intake-db"}
DB_USER=${DB_USER:-"postgres"}
OUTPUT_FILE="forensic_state_$(date +%Y%m%d_%H%M%S).json"
HASH_FILE="forensic_state.sha256"

echo "🔬 Starting Forensic State Hash Protocol (Docker)..."

# 1. Forensic Table List (Case-Linked Domains)
TABLES=(
    "clinical_cases"
    "case_event_log"
    "clinical_case_attachments"
    "clients"
    "intakes"
    "intake_assessments"
)

# 2. Canonical Dump Process
echo "📂 Extracting canonical data snapshots from $CONTAINER_NAME..."
echo "[" > $OUTPUT_FILE

for i in "${!TABLES[@]}"; do
    TABLE=${TABLES[$i]}
    echo "   - Mapping $TABLE..."
    
    # Run query inside docker, pipe result to host jq for canonical sorting
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -t -c "COPY (SELECT row_to_json(t) FROM (SELECT * FROM $TABLE ORDER BY id) t) TO STDOUT" | \
    jq --sort-keys -c . >> $OUTPUT_FILE
    
    # Add comma if not last table
    if [ $i -lt $((${#TABLES[@]} - 1)) ]; then
        echo "," >> $OUTPUT_FILE
    fi
done

echo "]" >> $OUTPUT_FILE

# 3. Deterministic Hashing
echo "💎 Generating SHA256 State Fingerprint..."
sha256sum $OUTPUT_FILE | awk '{ print $1 }' > $HASH_FILE

echo "✅ Forensic Protocol Complete."
echo "   Artifact: $OUTPUT_FILE"
echo "   State Hash: $(cat $HASH_FILE)"
