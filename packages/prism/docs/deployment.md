# Prism Deployment Guide

This guide covers deployment strategies, configuration, and operational considerations for the Prism service in production environments.

## Overview

Prism is a critical system component responsible for:
- System initialization and bootstrapping
- Batch data operations 
- Cache management and rebuilding
- Health monitoring and status aggregation

Proper deployment ensures reliable system startup, data integrity, and optimal performance.

## Deployment Architecture

### Production Topology

```
┌─────────────────┐
│   Load Balancer │ ← External access (optional)
└─────────────────┘
         │
┌─────────────────┐
│     Prism       │ ← Port 3005 (WebSocket + HTTP)
│   (Container)   │
└─────────────────┘
         │
┌─────────┬─────────┐
│  Neo4j  │  Redis  │ ← Database dependencies
│  :7687  │  :6379  │
└─────────┴─────────┘
```

### Container Configuration

**Docker Compose (Recommended)**:
```yaml
version: "3.8"
services:
  prism:
    container_name: prism
    build:
      context: ./
      dockerfile: Dockerfile.prism
    restart: always
    environment:
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=${NEO4J_PASSWORD}
      - REDIS_URL=redis://redis:6379
      - PRISM_PORT=3005
      - NODE_ENV=production
    volumes:
      - ./seed_xls:/usr/src/app/seed_xls:ro
      - ./seed_csv:/usr/src/app/seed_csv
      - /var/lib/neo4j/import:/var/lib/neo4j/import
    ports:
      - "3005:3005"
    depends_on:
      neo4j:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3005/status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Environment Configuration

### Required Environment Variables

```bash
# Database Connections
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_secure_password
REDIS_URL=redis://redis:6379

# Service Configuration  
PRISM_PORT=3005
NODE_ENV=production

# Data Directories
PRISM_SEED_XLS_DIR=/usr/src/app/seed_xls
PRISM_CSV_OUTPUT_DIR=/usr/src/app/seed_csv
PRISM_NEO4J_IMPORT_DIR=/var/lib/neo4j/import
```

### Optional Configuration

```bash
# UID Management
PRISM_MIN_FREE_UID=1000000000
PRISM_MIN_FREE_FACT_UID=2000000000
PRISM_MAX_TEMP_UID=1000

# Performance Tuning
NEO4J_BATCH_SIZE=1000
CACHE_BATCH_SIZE=5000
NEO4J_TIMEOUT=30000
REDIS_TIMEOUT=5000

# Logging
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true

# Security
CORS_ORIGINS=https://your-domain.com
WEBSOCKET_ORIGINS=wss://your-domain.com
```

## Resource Requirements

### Minimum Requirements

| Component | CPU | Memory | Storage | Network |
|-----------|-----|--------|---------|---------|
| Prism Service | 1 core | 1GB RAM | 1GB temp | 100Mbps |
| Neo4j | 2 cores | 4GB RAM | 20GB SSD | 1Gbps |
| Redis | 1 core | 2GB RAM | 1GB | 100Mbps |

### Recommended Production

| Component | CPU | Memory | Storage | Network |
|-----------|-----|--------|---------|---------|
| Prism Service | 2 cores | 4GB RAM | 10GB | 1Gbps |
| Neo4j | 4 cores | 16GB RAM | 100GB SSD | 1Gbps |
| Redis | 2 cores | 8GB RAM | 5GB SSD | 1Gbps |

### Scaling Considerations

**Vertical Scaling**:
- Increase memory for large dataset processing
- Add CPU cores for concurrent operations
- Faster storage for CSV processing

**Horizontal Scaling**:
- Prism is currently single-instance (stateful setup process)
- Consider load balancing for health check endpoints
- Database scaling through clustering/replication

## Security Configuration

### Network Security

**Firewall Rules**:
```bash
# Allow WebSocket connections
iptables -A INPUT -p tcp --dport 3005 -j ACCEPT

# Restrict database access  
iptables -A INPUT -p tcp --dport 7687 -s prism_subnet -j ACCEPT
iptables -A INPUT -p tcp --dport 6379 -s prism_subnet -j ACCEPT
```

**TLS/SSL Configuration**:
```yaml
# For production, use reverse proxy with TLS
nginx:
  server_name: prism.yourdomain.com
  ssl_certificate: /path/to/cert.pem
  ssl_certificate_key: /path/to/key.pem
  
  location / {
    proxy_pass http://prism:3005;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
```

### Authentication & Authorization

**Environment Variables**:
```bash
# JWT Configuration (if using authentication)
JWT_SECRET=your_very_secure_jwt_secret
JWT_EXPIRATION=24h

# Database Authentication
NEO4J_PASSWORD=secure_neo4j_password
REDIS_PASSWORD=secure_redis_password
```

**Access Control**:
- Restrict setup operations to admin users
- Validate WebSocket connections
- Log all administrative operations

### Data Protection

**Sensitive Data Handling**:
- Never log passwords or tokens
- Encrypt data at rest (database level)
- Secure seed file access permissions
- Regular security audits

## Monitoring & Observability

### Health Checks

**Application Health**:
```bash
# HTTP health endpoint
curl -f http://localhost:3005/status

# WebSocket connectivity check
wscat -c ws://localhost:3005 -x '{"type":":prism.health/status","payload":{}}'
```

**Database Health**:
```bash
# Neo4j connectivity
docker exec neo4j cypher-shell "MATCH (n) RETURN count(n) LIMIT 1;"

# Redis connectivity  
docker exec redis redis-cli ping
```

### Metrics Collection

**Key Metrics to Monitor**:
- Setup completion rates and times
- Cache rebuild frequency and duration
- WebSocket connection counts
- Database query performance
- Memory and CPU utilization
- Error rates by operation type

**Prometheus Configuration**:
```yaml
# Example metrics exposition
- job_name: 'prism'
  static_configs:
    - targets: ['prism:3005']
  metrics_path: '/metrics'
  scrape_interval: 30s
```

### Logging Strategy

**Log Levels**:
```bash
# Production logging
LOG_LEVEL=info              # Standard operations
LOG_LEVEL=warn             # For warnings and recoverable errors
LOG_LEVEL=error            # For system errors only

# Development/debugging
LOG_LEVEL=debug            # Detailed execution traces
```

**Log Aggregation**:
```yaml
# Example Fluentd configuration
<source>
  @type docker
  container_name prism
  format json
</source>

<match prism.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name prism-logs
</match>
```

## Backup & Recovery

### Data Backup Strategy

**Neo4j Backup**:
```bash
# Regular database backups
docker exec neo4j neo4j-admin dump --database=neo4j --to=/backups/neo4j-$(date +%Y%m%d).dump

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/neo4j"
DATE=$(date +%Y%m%d-%H%M)
docker exec neo4j neo4j-admin dump --database=neo4j --to=/backups/neo4j-$DATE.dump
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete
```

**Redis Backup**:
```bash
# Save Redis state
docker exec redis redis-cli BGSAVE

# Copy RDB file
docker cp redis:/data/dump.rdb ./backups/redis-$(date +%Y%m%d).rdb
```

**Configuration Backup**:
- Environment variable configurations
- Docker compose files
- Seed data files
- TLS certificates

### Disaster Recovery

**Recovery Procedures**:

1. **Database Recovery**:
   ```bash
   # Stop services
   docker-compose down
   
   # Restore Neo4j
   docker exec neo4j neo4j-admin load --from=/backups/neo4j-latest.dump --database=neo4j --force
   
   # Restore Redis
   docker cp ./backups/redis-latest.rdb redis:/data/dump.rdb
   
   # Restart services
   docker-compose up -d
   ```

2. **Service Recovery**:
   ```bash
   # Pull latest images
   docker-compose pull
   
   # Rebuild and restart
   docker-compose up --build -d
   
   # Verify health
   curl -f http://localhost:3005/status
   ```

3. **Data Validation**:
   - Run health checks on all services
   - Verify cache consistency
   - Test setup process with new installation

## Performance Optimization

### Database Optimization

**Neo4j Tuning**:
```bash
# Memory configuration
NEO4J_dbms_memory_heap_initial__size=2g
NEO4J_dbms_memory_heap_max__size=4g
NEO4J_dbms_memory_pagecache_size=2g

# Query optimization
NEO4J_dbms_query_cache_size=1000
NEO4J_dbms_query_cache_ttl=60s
```

**Redis Tuning**:
```bash
# Memory management
redis-cli config set maxmemory 4gb
redis-cli config set maxmemory-policy allkeys-lru

# Persistence optimization
redis-cli config set save "900 1 300 10 60 10000"
```

### Application Optimization

**Batch Processing**:
```bash
# Optimize batch sizes based on available memory
CACHE_BATCH_SIZE=10000      # For systems with 8GB+ RAM
NEO4J_BATCH_SIZE=2000       # For high-performance Neo4j

# Connection pooling
NEO4J_MAX_CONNECTIONS=50
REDIS_POOL_SIZE=20
```

**Memory Management**:
```bash
# Node.js memory limits
NODE_OPTIONS="--max-old-space-size=4096"

# Garbage collection optimization
NODE_OPTIONS="--expose-gc --optimize-for-size"
```

## Troubleshooting

### Common Issues

**Service Won't Start**:
```bash
# Check port availability
netstat -tulpn | grep 3005

# Verify dependencies
docker-compose ps
docker-compose logs neo4j redis

# Check configurations
docker-compose config
```

**Setup Process Fails**:
```bash
# Check database connectivity
docker exec prism curl -f http://neo4j:7474

# Verify seed files
docker exec prism ls -la /usr/src/app/seed_xls/

# Review setup logs
docker-compose logs -f prism | grep setup
```

**Performance Issues**:
```bash
# Monitor resource usage
docker stats prism neo4j redis

# Check query performance
docker exec neo4j cypher-shell "CALL dbms.listQueries();"

# Review slow operations
docker-compose logs prism | grep -i "slow\|timeout"
```

### Debug Mode

**Enable Debug Logging**:
```bash
# Set environment variable
LOG_LEVEL=debug

# Or modify docker-compose.yml
environment:
  - LOG_LEVEL=debug
  - CACHE_DEBUG_LOGGING=true

# Restart service
docker-compose restart prism
```

**WebSocket Debugging**:
```bash
# Test WebSocket connectivity
wscat -c ws://localhost:3005

# Send test message
{"type":":prism.health/status","payload":{}}

# Monitor WebSocket traffic
docker-compose logs -f prism | grep -i websocket
```

## Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database credentials secured
- [ ] Network policies defined
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Health checks defined

### Deployment

- [ ] Build and test Docker images
- [ ] Deploy to staging environment
- [ ] Run integration tests
- [ ] Verify setup process
- [ ] Test cache rebuild operations
- [ ] Validate health monitoring

### Post-Deployment

- [ ] Monitor service startup
- [ ] Verify database connections
- [ ] Test WebSocket connectivity
- [ ] Run basic functionality tests
- [ ] Check log outputs
- [ ] Validate monitoring alerts

### Production Validation

- [ ] Setup process completes successfully
- [ ] Cache rebuilds work correctly
- [ ] Health checks return expected results
- [ ] Performance metrics within targets
- [ ] Error rates within acceptable limits
- [ ] Backup procedures tested

## Best Practices

### Operations

1. **Regular Maintenance**:
   - Weekly cache rebuilds during low-traffic periods
   - Monthly security updates
   - Quarterly performance reviews

2. **Monitoring**:
   - Set up alerts for service failures
   - Monitor cache hit rates
   - Track setup completion times

3. **Security**:
   - Regular credential rotation
   - Keep dependencies updated
   - Monitor access logs

4. **Performance**:
   - Profile large data imports
   - Optimize query patterns
   - Scale resources based on usage

### Development to Production

1. **Testing**:
   - Integration tests with production-like data volumes
   - Load testing for cache operations
   - Disaster recovery testing

2. **Configuration Management**:
   - Environment-specific configurations
   - Secret management best practices
   - Version-controlled deployment scripts

3. **Documentation**:
   - Keep deployment docs updated
   - Document configuration changes
   - Maintain troubleshooting guides

---

For additional deployment support, refer to the main [Prism documentation](../README.md) or consult the system architecture documentation.