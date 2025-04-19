# Docker Setup

This repository uses Docker for containerizing services and providing consistent development and deployment environments.

## Docker File Structure

All Dockerfiles are located in their respective package directories:

```
packages_clj/
  aperture/
    docker/
      Dockerfile        # For deployment
      Dockerfile.dev    # For local development
  archivist/
    docker/
      Dockerfile        # For deployment
      Dockerfile.dev    # For local development
  clarity/
    docker/
      Dockerfile        # For deployment
      Dockerfile.dev    # For local development
  portal/
    docker/
      Dockerfile        # For deployment
      Dockerfile.dev    # For local development
  prism/
    docker/
      Dockerfile        # For deployment
      Dockerfile.dev    # For local development
  shutter/
    docker/
      Dockerfile        # For deployment
      Dockerfile.dev    # For local development

packages_py/
  nous/
    docker/
      Dockerfile        # For deployment
      Dockerfile.dev    # For local development

packages_ts/
  frontend/
    viewfinder/
      docker/
        Dockerfile      # For deployment
        Dockerfile.dev  # For local development
  core/
    dataplex/
      docker/
        Dockerfile.postgres  # PostgreSQL with pgvector
```

## Docker Environments

### Development Environment

- Uses `Dockerfile.dev` variants
- Services connect via localhost networking
- Code is mounted as volumes for hot-reloading
- Optimized for fast development cycles
- Started with: `docker-compose -f docker-compose.dev.yml up`

### Deployment Environment

- Uses regular `Dockerfile` variants
- Services connect via container network (rlc-net)
- Code is copied into containers
- Optimized for stability and security
- Started with: `docker-compose up`

## Common Docker Commands

- Start development environment: `docker-compose -f docker-compose.dev.yml up`
- Start production environment: `docker-compose up`
- Build specific service: `docker-compose build <service-name>`
- Rebuild and start specific service: `docker-compose up --build <service-name>`
- View logs for service: `docker-compose logs -f <service-name>`
- Stop all services: `docker-compose down`