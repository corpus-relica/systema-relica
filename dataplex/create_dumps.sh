#!/usr/bin/env sh

# Specify your container names
NEO4J_CONTAINER="dataplex_neo4j_1"
REDIS_CONTAINER="dataplex_redis_1"
POSTGRES_CONTAINER="dataplex_postgres_1"
POSTGRES_DB="postgres"
POSTGRES_USER="postgres"

# Directory on the host to store dumps
DUMP_DIR="./dumps"

# Ensure dump directories exist
mkdir -p $DUMP_DIR/neo4j
mkdir -p $DUMP_DIR/redis
mkdir -p $DUMP_DIR/postgres

echo ">> Stopping Neo4j database..."
docker exec $NEO4J_CONTAINER neo4j stop

echo ">> Creating Neo4j dump..."
docker run --interactive --tty --rm \
   --volume=./data/neo4j:/data \
   --volume=$DUMP_DIR/neo4j:/backups \
   neo4j/neo4j-admin:5.12.0 \
neo4j-admin database dump neo4j --to-path=/backups --overwrite-destination

echo ">> Starting Neo4j database..."
docker-compose up -d neo4j

echo ">> Neo4j dump created."

echo ">> Saving Redis database..."
# Trigger a Redis SAVE to create a snapshot
docker exec $REDIS_CONTAINER redis-cli SAVE
# Copy the dump file from the Redis data directory to the dump directory
docker cp $REDIS_CONTAINER:/data/dump.rdb $DUMP_DIR/redis/
echo ">> Redis database saved."

echo ">> Creating Postgres dump..."
# Use pg_dump to create a dump and save it directly to the specified directory
docker exec -t $POSTGRES_CONTAINER pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > $DUMP_DIR/postgres/${POSTGRES_DB}_dump.sql
echo ">> Postgres dump created."

echo ">> All dumps have been created."
