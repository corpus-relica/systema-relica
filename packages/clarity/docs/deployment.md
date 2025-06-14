# Clarity Deployment Guide

This guide covers deployment strategies, configuration, monitoring, and production best practices for the Clarity semantic model service.

## Overview

Clarity is designed for production deployment as a containerized microservice with WebSocket-first architecture. This guide covers both development and production deployment scenarios.

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 2 cores
- Memory: 4GB RAM
- Storage: 10GB available space
- Node.js: v18+ (for development)

**Recommended Production:**
- CPU: 4+ cores
- Memory: 8GB+ RAM  
- Storage: 50GB+ SSD
- Load balancer with WebSocket support

### Dependencies

**Required Services:**
- **Archivist**: Knowledge graph data access (port 3000)
- **PostgreSQL**: Entity metadata storage (port 5432)
- **Redis**: Optional caching layer (port 6379)

**Optional Services:**
- **Portal**: API gateway for WebSocket routing
- **NOUS**: AI-powered semantic operations (future)

## Environment Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```bash
# Service Configuration
NODE_ENV=production
RELICA_CLARITY_API_PORT=3001

# Database Configuration  
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=clarity_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=clarity_db

# External Service URLs
ARCHIVIST_URL=http://archivist:3000

# AI Integration (optional)
OPENAI_API_KEY=your_openai_api_key_here

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# Security Configuration
CORS_ORIGIN=https://your-frontend-domain.com
WS_CORS_ORIGIN=https://your-frontend-domain.com

# Performance Configuration
WS_MAX_CONNECTIONS=1000
WS_PING_TIMEOUT=60000
WS_PING_INTERVAL=25000
```

### Production Environment Variables

```bash
# Production overrides
NODE_ENV=production
LOG_LEVEL=warn

# Security
CORS_ORIGIN=https://app.relica.com,https://admin.relica.com
WS_CORS_ORIGIN=https://app.relica.com,https://admin.relica.com

# Performance tuning
WS_MAX_CONNECTIONS=5000
WS_PING_TIMEOUT=30000
WS_PING_INTERVAL=25000

# Database connection pooling
POSTGRES_MAX_CONNECTIONS=50
POSTGRES_IDLE_TIMEOUT=10000
POSTGRES_CONNECTION_TIMEOUT=5000

# External service timeouts
ARCHIVIST_TIMEOUT=30000
ARCHIVIST_RETRY_ATTEMPTS=3
```

## Docker Deployment

### Development Deployment

**Using Docker Compose:**

```bash
# Start all services including dependencies
docker-compose up clarity

# Start with dependencies
docker-compose up clarity archivist postgres

# View logs
docker-compose logs -f clarity
```

**Dockerfile Overview:**
```dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy dependency files
COPY package.json yarn.lock ./
COPY packages/clarity ./packages/clarity
COPY packages/constants ./packages/constants  
COPY packages/types ./packages/types

# Install dependencies
RUN yarn install --frozen-lockfile

# Build application
WORKDIR /usr/src/app/packages/clarity
RUN yarn build

# Expose port
EXPOSE 3001

# Start application
CMD ["yarn", "start:prod"]
```

### Production Deployment

**Production Docker Compose:**

```yaml
version: '3.8'

services:
  clarity:
    image: relica/clarity:latest
    container_name: clarity-prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - RELICA_CLARITY_API_PORT=3001
      - POSTGRES_HOST=postgres-prod
      - ARCHIVIST_URL=http://archivist-prod:3000
    env_file:
      - .env.prod
    ports:
      - "3001:3001"
    depends_on:
      - postgres-prod
      - archivist-prod
    networks:
      - relica-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres-prod:
    image: postgres:15-alpine
    container_name: postgres-clarity-prod
    restart: unless-stopped
    environment:
      - POSTGRES_DB=clarity_db
      - POSTGRES_USER=clarity_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres-clarity-data:/var/lib/postgresql/data
    networks:
      - relica-network

volumes:
  postgres-clarity-data:

networks:
  relica-network:
    external: true
```

## Kubernetes Deployment

### Kubernetes Manifests

**Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: clarity
  namespace: relica
spec:
  replicas: 3
  selector:
    matchLabels:
      app: clarity
  template:
    metadata:
      labels:
        app: clarity
    spec:
      containers:
      - name: clarity
        image: relica/clarity:v1.0.0
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: POSTGRES_HOST
          value: "postgres-service"
        - name: ARCHIVIST_URL
          value: "http://archivist-service:3000"
        envFrom:
        - secretRef:
            name: clarity-secrets
        - configMapRef:
            name: clarity-config
        resources:
          requests:
            memory: "2Gi"
            cpu: "500m"
          limits:
            memory: "4Gi" 
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 10
```

**Service:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: clarity-service
  namespace: relica
spec:
  selector:
    app: clarity
  ports:
  - name: websocket
    port: 3001
    targetPort: 3001
  type: ClusterIP
```

**ConfigMap:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: clarity-config
  namespace: relica
data:
  RELICA_CLARITY_API_PORT: "3001"
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
  WS_MAX_CONNECTIONS: "5000"
  WS_PING_TIMEOUT: "30000"
  WS_PING_INTERVAL: "25000"
```

**Secret:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: clarity-secrets
  namespace: relica
type: Opaque
stringData:
  POSTGRES_PASSWORD: "secure_database_password"
  OPENAI_API_KEY: "your_openai_api_key"
```

## Load Balancing and Scaling

### WebSocket Load Balancing

**Nginx Configuration:**
```nginx
upstream clarity_backend {
    ip_hash; # Required for WebSocket sticky sessions
    server clarity-1:3001;
    server clarity-2:3001;
    server clarity-3:3001;
}

server {
    listen 443 ssl;
    server_name clarity.relica.com;

    # SSL configuration
    ssl_certificate /etc/ssl/certs/relica.crt;
    ssl_certificate_key /etc/ssl/private/relica.key;

    # WebSocket proxying
    location / {
        proxy_pass http://clarity_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        
        # Connection timeouts
        proxy_connect_timeout 60s;
    }
}
```

### Horizontal Scaling

**Auto-scaling with Kubernetes:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: clarity-hpa
  namespace: relica
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: clarity
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Monitoring and Observability

### Health Checks

**Health Endpoint Implementation:**
```typescript
// Add to main.ts or separate health controller
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'clarity',
    version: process.env.npm_package_version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {
      database: 'connected', // Check actual DB connection
      archivist: 'available'  // Check Archivist service
    }
  });
});
```

### Metrics Collection

**Prometheus Metrics:**
```typescript
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Collect default Node.js metrics
collectDefaultMetrics();

// Custom metrics
const wsConnections = new Counter({
  name: 'clarity_websocket_connections_total',
  help: 'Total number of WebSocket connections',
  labelNames: ['status']
});

const requestDuration = new Histogram({
  name: 'clarity_request_duration_seconds',
  help: 'Duration of semantic operations',
  labelNames: ['operation', 'category']
});

// Add metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Logging Configuration

**Structured Logging:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.simple()
  ),
  defaultMeta: { service: 'clarity' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});
```

## Security Configuration

### WebSocket Security

**CORS Configuration:**
```typescript
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const corsOptions: CorsOptions = {
  origin: process.env.WS_CORS_ORIGIN?.split(',') || false,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Apply to WebSocket gateway
@WebSocketGateway({
  cors: corsOptions,
  transports: ['websocket']
})
```

### Authentication Integration

**JWT Token Validation:**
```typescript
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection {
  
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = await this.jwtService.verifyAsync(token);
      
      // Store user context
      client.data.user = payload;
      
      this.logger.log(`Authenticated user ${payload.sub} connected`);
    } catch (error) {
      this.logger.warn(`Unauthenticated connection attempt: ${error.message}`);
      client.disconnect();
    }
  }
}
```

## Database Management

### Migration Strategy

**TypeORM Migrations:**
```bash
# Generate migration
yarn typeorm migration:generate -n AddClarityEntities

# Run migrations in production
yarn typeorm migration:run

# Revert if needed
yarn typeorm migration:revert
```

**Migration Example:**
```typescript
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddClarityEntities1234567890 implements MigrationInterface {
  
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'modelling_session',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'name', type: 'varchar', length: '255' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' }
      ]
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('modelling_session');
  }
}
```

### Backup Strategy

**Automated Backups:**
```bash
#!/bin/bash
# backup-clarity.sh

DB_NAME="clarity_db" 
DB_USER="clarity_user"
BACKUP_DIR="/backups/clarity"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
pg_dump -h $POSTGRES_HOST -U $DB_USER -d $DB_NAME \
  --verbose --no-acl --no-owner \
  --file="$BACKUP_DIR/clarity_backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/clarity_backup_$DATE.sql"

# Retain only last 30 days
find $BACKUP_DIR -name "clarity_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: clarity_backup_$DATE.sql.gz"
```

## Performance Optimization

### Connection Pooling

**Database Connection Pool:**
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  
  // Connection pooling
  extra: {
    max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS, 10) || 50,
    connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT, 10) || 5000,
    idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT, 10) || 10000,
  },
  
  // Production optimizations
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  cache: {
    duration: 30000 // 30 seconds
  }
})
```

### WebSocket Optimization

**Connection Management:**
```typescript
@WebSocketGateway({
  maxHttpBufferSize: 1e6, // 1MB
  pingTimeout: parseInt(process.env.WS_PING_TIMEOUT, 10) || 60000,
  pingInterval: parseInt(process.env.WS_PING_INTERVAL, 10) || 25000,
  transports: ['websocket']
})
export class EventsGateway {
  
  private connectionCount = 0;
  private readonly maxConnections = parseInt(process.env.WS_MAX_CONNECTIONS, 10) || 1000;
  
  handleConnection(client: Socket) {
    if (this.connectionCount >= this.maxConnections) {
      client.emit('error', { message: 'Server at capacity' });
      client.disconnect();
      return;
    }
    
    this.connectionCount++;
    this.logger.log(`Active connections: ${this.connectionCount}`);
  }
  
  handleDisconnect(client: Socket) {
    this.connectionCount--;
  }
}
```

## Troubleshooting

### Common Issues

**WebSocket Connection Issues:**
```bash
# Check service status
docker-compose ps clarity

# Check logs
docker-compose logs -f clarity

# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: test" \
  -H "Sec-WebSocket-Version: 13" \
  http://localhost:3001/socket.io/
```

**Database Connection Issues:**
```bash
# Test database connectivity
docker-compose exec clarity yarn typeorm query "SELECT 1"

# Check PostgreSQL logs
docker-compose logs postgres

# Verify database exists
docker-compose exec postgres psql -U clarity_user -d clarity_db -c "\dt"
```

**Memory Issues:**
```bash
# Monitor memory usage
docker stats clarity

# Analyze Node.js heap
docker-compose exec clarity node --inspect-brk=0.0.0.0:9229 dist/main.js

# Generate heap snapshot
curl -X POST http://localhost:3001/debug/heapdump
```

### Recovery Procedures

**Service Recovery:**
```bash
# Graceful restart
docker-compose restart clarity

# Force restart with cleanup
docker-compose down clarity
docker-compose up -d clarity

# Scale down and up
docker-compose up -d --scale clarity=0
docker-compose up -d --scale clarity=3
```

This deployment guide provides comprehensive coverage for production deployment of Clarity, ensuring reliable operation in various environments while maintaining performance and security standards.