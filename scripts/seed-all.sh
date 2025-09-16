#!/bin/bash
# This script automates seeding data from all CSV files in the specified data directory.

# --- Configuration ---
# Set the absolute path to the directory containing your CSV files.
DATA_DIR="/home/spec2/successful-bid-data"

# --- Script Body ---
set -e # Exit immediately if a command exits with a non-zero status.

# Check if the data directory exists
if [ ! -d "$DATA_DIR" ]; then
  echo "Error: Data directory not found at $DATA_DIR"
  exit 1
fi

echo "Starting bulk data seeding from: $DATA_DIR"

# Find all files ending with .csv in the data directory and process them
find "$DATA_DIR" -type f -name "*.csv" | while read -r filepath; do
  # The seed.ts script expects just the filename, not the full path.
  filename=$(basename "$filepath")
  
  echo ""
  echo "--------------------------------------------------"
  echo "Processing file: $filename"
  echo "--------------------------------------------------"
  
  # Execute the seed command for the current file
  npm run db:seed -- --file="$filename"
done

echo ""
echo "--------------------------------------------------"
echo "✅ All CSV files have been processed successfully."
echo "--------------------------------------------------"
