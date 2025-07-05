# PM2 Architecture Migration Guide

This guide documents the migration from the original 7-container architecture to a unified PM2-managed backend container.

## Architecture Changes

### Before (Multi-Container)
- 7 individual backend containers (Portal, Archivist, Clarity, Aperture, Shutter, Prism, NOUS)
- Docker network-based service discovery (`service-name:port`)
- Complex orchestration and networking

### After (PM2 Single Container)
- 1 unified backend container with PM2 managing all services
- Localhost-based service discovery (`localhost:port`)
- Simplified networking and debugging

## Migration Steps

### 1. Stop Current Services
```bash
# Stop the existing multi-container setup
docker-compose down
```

### 2. Build New Unified Backend
```bash
# Build the new PM2-based backend container
docker-compose -f docker-compose.pm2.yml build backend
```

### 3. Start New Architecture
```bash
# Start with the new PM2-based configuration
docker-compose -f docker-compose.pm2.yml up -d
```

### 4. Verify Services
```bash
# Check PM2 process status inside container
docker exec systema-relica-backend pm2 list

# Check service health endpoints
curl http://localhost:2204/health  # Portal
curl http://localhost:3000/health  # Archivist  
curl http://localhost:3001/health  # Clarity
curl http://localhost:3002/health  # Aperture
curl http://localhost:3004/health  # Shutter
curl http://localhost:3005/health  # Prism
curl http://localhost:3006/health  # NOUS
```

### 5. Monitor Logs
```bash
# View all service logs through PM2
docker exec systema-relica-backend pm2 logs

# View specific service logs
docker exec systema-relica-backend pm2 logs portal
docker exec systema-relica-backend pm2 logs archivist
# etc.
```

## Key Files

- **`ecosystem.config.js`** - PM2 process configuration for all services
- **`Dockerfile.backend`** - Unified container supporting Node.js + Python
- **`docker-compose.pm2.yml`** - Simplified compose file (3 containers total)

## Service Communication Changes

All inter-service communication now uses `localhost` instead of container names:

### Before
```typescript
ARCHIVIST_HOST=archivist
ARCHIVIST_PORT=3000
```

### After  
```typescript
ARCHIVIST_HOST=localhost
ARCHIVIST_PORT=3000
```

## Benefits

1. **Simplified Networking**: No Docker network complexity
2. **Faster Startup**: Single container to orchestrate
3. **Easier Debugging**: All logs centralized in PM2
4. **Resource Efficiency**: Shared runtime reduces memory footprint
5. **Development Simplicity**: One backend container to manage

## Rollback Plan

If issues arise, rollback to the original architecture:

```bash
# Stop PM2 setup
docker-compose -f docker-compose.pm2.yml down

# Restart original multi-container setup
docker-compose up -d
```

## Troubleshooting

### PM2 Process Issues
```bash
# Restart a specific service
docker exec systema-relica-backend pm2 restart portal

# View detailed process info
docker exec systema-relica-backend pm2 show portal

# Monitor real-time logs
docker exec systema-relica-backend pm2 logs --follow
```

### Port Conflicts
Each service runs on its dedicated port within the container:
- Portal: 2204
- Archivist: 3000  
- Clarity: 3001
- Aperture: 3002
- Shutter: 3004
- Prism: 3005
- NOUS: 3006

### Service Discovery Issues
All services should connect to `localhost:PORT` within the backend container. Check the PM2 ecosystem configuration if connection issues persist.

## Performance Considerations

- **Memory**: Single container requires more RAM (4GB limit vs. individual limits)
- **CPU**: Services share CPU resources (4 cores limit)
- **Scaling**: Individual service scaling requires PM2 cluster mode (currently disabled)

## Next Steps

1. Test the new architecture thoroughly
2. Update documentation to reflect new deployment model
3. Consider PM2 cluster mode for high-traffic services
4. Implement PM2 monitoring dashboard if needed