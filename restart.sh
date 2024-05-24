#!/usr/bin/env sh

docker-compose down
yarn workspace @relica/hsm-manager build
yarn workspace @relica/archivist build
docker-compose up --build -d
