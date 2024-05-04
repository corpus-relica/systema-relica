#!/usr/bin/env sh

# Load environment variables
if [ -f script.env ]; then
    . "./script.env"
else
    echo "Environment file script.env not found."
    exit 1
fi

# Ensure that the data directories have correct permissions
sudo chown -R $USER:$USER ./data/redis

# Stopping services
echo ">> Stopping Neo4j, Redis, and PostgreSQL containers..."
docker-compose stop neo4j redis # postgres

# Prepare Neo4j dump restoration
echo ">> Preparing for Neo4j dump restoration..."
mkdir -p ./data/neo4j
mkdir -p $IMPORT_DIR/neo4j

# Loading Neo4j dump
echo ">> Loading Neo4j dump..."
docker run --interactive --tty --rm \
    --volume=$(pwd)/data/neo4j:/data \
    --volume=$(pwd)/$IMPORT_DIR/neo4j:/backups \
    neo4j:5.12.0 \
    neo4j-admin database load neo4j --from-path=/backups --overwrite-destination

# Restore Redis dump
echo ">> Restoring Redis dump..."
cp $IMPORT_DIR/redis/dump.rdb ./data/redis/dump.rdb

# Fix permissions to match the Redis container's user and group
# This command changes ownership of the dump file to UID 999 and GID 999, which are typically used by the Redis process within Docker containers.
# You might need to adjust these values based on your specific Docker image or setup.
# sudo chown 999:999 ./data/redis/dump.rdb

# Ensure the dump file is readable and writable by the Redis process
sudo chmod 777 ./data/redis/dump.rdb

# Drop all tables in the PostgreSQL database
echo ">> Dropping all tables in PostgreSQL database..."
docker exec -i $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
END
\$\$;
"
# Restore PostgreSQL dump
echo ">> Restoring PostgreSQL dump..."
docker exec -i $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB < $IMPORT_DIR/postgres/postgres_dump.sql || echo "PostgreSQL restore failed."

# Starting services
echo ">> Starting Neo4j, Redis, and PostgreSQL containers..."
docker-compose up -d neo4j redis # postgres

echo ">> All dumps have been loaded successfully."
