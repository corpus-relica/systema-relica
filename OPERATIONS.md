# Operations Guide

## 1. System Deployment Architecture

### 1.1 Overview
The system consists of multiple microservices deployed using Docker containers, with three primary data stores:

- PostgreSQL (relational data)
- Neo4j (graph database)
- Redis (caching layer)

### 1.2 Service Architecture

```mermaid
graph TD
    DB1[Redis] --> Archivist
    DB2[PostgreSQL] --> Archivist
    DB3[Neo4j] --> Archivist
    
    Archivist --> Clarity
    Archivist --> Aperture
    Archivist --> Prism
    
    Clarity --> Portal
    Aperture --> Portal
    Prism --> Portal
    
    PostgreSQL --> Aperture
    PostgreSQL --> Shutter
    
    Clarity --> Nous
    Aperture --> Nous
    
    Portal --> Viewfinder
    Shutter --> Portal
</mermaid>

### 1.3 Network Configuration
- All services communicate over a dedicated Docker network (`rlc-net`)
- Internal service discovery uses Docker DNS resolution
- External access is provided through mapped ports

### 1.4 Port Mappings
| Service    | Port  | Purpose           |
|------------|-------|-------------------|
| Redis      | 6379  | Cache access      |
| PostgreSQL | 5432  | Database access   |
| Neo4j      | 7474  | HTTP interface    |
| Neo4j      | 7687  | Bolt protocol     |
| Archivist  | 3000  | API endpoint      |
| Clarity    | 2176  | Service endpoint  |
| Aperture   | 2175  | Service endpoint  |
| Prism      | 3333  | Service endpoint  |
| Portal     | 2174  | Service endpoint  |
| Shutter    | 2173  | Service endpoint  |
| Nous       | 2204  | Service endpoint  |
| Viewfinder | 80    | Web interface     |

## 2. Database Setup and Management

### 2.1 PostgreSQL
- **Data Location**: `./packages_ts/core/dataplex/data/postgres`
- **Init Scripts**: `./packages_ts/core/dataplex/init_scripts/postgres`
- **Extensions**: pg_vector (required for vector operations)
- **Default Credentials**:
  - Username: postgres
  - Password: password (change in production)
  - Database: postgres

### 2.2 Neo4j
- **Data Location**: `./packages_ts/core/dataplex/data/neo4j`
- **Import Directory**: `./seed_csv`
- **Configuration**:
  - APOC plugin enabled
  - Bolt protocol on port 7687
  - HTTP interface on port 7474
- **Default Credentials**:
  - Username: neo4j
  - Password: password (change in production)

### 2.3 Redis
- **Data Location**: `./packages_ts/core/dataplex/data/redis`
- **Configuration**:
  - Password authentication enabled
  - Default password: redis (change in production)

## 3. Service Dependencies and Startup Order

### 3.1 Startup Sequence
1. **Data Layer** (must start first):
   - PostgreSQL
   - Neo4j
   - Redis

2. **Core Services** (after data layer is healthy):
   - Archivist (depends on all databases)
   - Prism (depends on Neo4j)
   - Shutter (depends on PostgreSQL)

3. **Middle Layer**:
   - Clarity (depends on Archivist)
   - Aperture (depends on Archivist and PostgreSQL)

4. **Integration Layer**:
   - Portal (depends on multiple services)
   - Nous (depends on Clarity and Aperture)

5. **Frontend**:
   - Viewfinder (depends on Portal)

### 3.2 Health Checks
- Neo4j includes a health check that verifies database connectivity
- Other services use Docker's built-in health check mechanism
- Services with dependencies wait for required services to be healthy

## 4. Monitoring and Maintenance

### 4.1 Service Health Monitoring
Monitor these endpoints for service health:
- Database connections
- Inter-service communication
- API endpoints
- WebSocket connections

### 4.2 Log Locations
- All services output logs to Docker's logging system
- Access logs using: `docker logs <container_name>`
- Important log paths:
  - PostgreSQL: /var/lib/postgresql/data/log
  - Neo4j: /data/logs
  - Application logs: Docker container logs

### 4.3 Common Maintenance Tasks
1. **Database Maintenance**:
   - PostgreSQL vacuuming
   - Neo4j garbage collection
   - Redis memory monitoring

2. **Log Rotation**:
   - Configure Docker log rotation
   - Monitor log volumes

3. **Performance Monitoring**:
   - Database query performance
   - Service response times
   - Memory usage
   - CPU utilization

## 5. Backup and Recovery Procedures

### 5.1 Backup Procedures

#### Database Backups
1. **PostgreSQL**:
   ```bash
   # Run from host machine
   docker exec postgres pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql
   ```

2. **Neo4j**:
   ```bash
   # Stop writes to Neo4j
   # Create backup
   docker exec neo4j neo4j-admin dump --database=neo4j --to=/data/backups/
   ```

3. **Redis**:
   ```bash
   # Trigger Redis backup
   docker exec redis redis-cli -a redis SAVE
   ```

#### Volume Backups
```bash
# Backup volume data
docker run --rm -v relica_postgres_data:/source:ro -v /path/to/backup:/backup ubuntu tar -czf /backup/postgres_backup.tar.gz -C /source .
```

### 5.2 Recovery Procedures

#### Database Recovery
1. **PostgreSQL**:
   ```bash
   # Restore from backup
   docker exec -i postgres psql -U postgres postgres < backup_20240101.sql
   ```

2. **Neo4j**:
   ```bash
   # Stop Neo4j
   # Restore from backup
   docker exec neo4j neo4j-admin load --from=/data/backups/backup.dump --database=neo4j
   ```

3. **Redis**:
   ```bash
   # Restore from backup
   docker exec redis redis-cli -a redis RESTORE
   ```

#### Emergency Recovery
1. Stop all services:
   ```bash
   docker-compose down
   ```

2. Restore data volumes from backups

3. Start services in correct order:
   ```bash
   docker-compose up -d redis postgres neo4j
   # Wait for databases to be ready
   docker-compose up -d archivist
   # Continue with remaining services
   ```

### 5.3 Backup Schedule
- Daily: Database backups
- Weekly: Full system backup including volumes
- Monthly: Archive of backups to long-term storage

## 6. Security Considerations

### 6.1 Credentials Management
- Change all default passwords in production
- Use environment variables for sensitive configuration
- Implement proper secrets management

### 6.2 Network Security
- Configure firewalls to restrict access
- Use TLS for external communications
- Regularly update security certificates

### 6.3 Access Control
- Implement role-based access control
- Monitor and audit access logs
- Regular security audits