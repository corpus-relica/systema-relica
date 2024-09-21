#!/bin/bash

# Set variables
CONTAINER_NAME="postgres"
BACKUP_DIR="./postgres_backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform the backup
echo "Starting PostgreSQL backup..."
docker exec $CONTAINER_NAME pg_dumpall -U postgres > $BACKUP_FILE

# Check if the backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully. Backup file: $BACKUP_FILE"
else
    echo "Backup failed."
    exit 1
fi

# Compress the backup file
gzip $BACKUP_FILE
echo "Backup compressed: ${BACKUP_FILE}.gz"
