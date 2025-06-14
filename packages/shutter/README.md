# Shutter Service

🔐 Authentication and access control service for Systema Relica

## Overview

Shutter is the dedicated authentication service in the Systema Relica microservices architecture. It handles:
- User authentication (login/logout)
- JWT token issuance and validation
- User management
- API token management (future enhancement)
- Guest authentication for setup processes

## Architecture

Shutter follows the Clojure reference implementation and provides authentication services that are consumed by Portal (API Gateway) and other services requiring user validation.

## Port

- **Development**: 3004
- **Docker**: 3004

## API Endpoints

### Authentication

- `POST /api/login` - User authentication with email/password
- `POST /api/guest-auth` - Limited guest token for setup
- `POST /api/validate` - Validate JWT token
- `GET /auth/profile` - Get authenticated user profile

### System

- `GET /health` - Service health check

## Environment Variables

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=postgres
JWT_SECRET=your-secret-key
PORT=3004
```

## Development

```bash
# Install dependencies
yarn install

# Run in development mode
yarn start:dev

# Run tests
yarn test

# Build for production
yarn build
```

## Docker

```bash
# Build and run with docker-compose
docker-compose up shutter

# Or standalone
docker build -f Dockerfile.shutter -t shutter .
docker run -p 3004:3004 shutter
```

## Security Notes

- Always use strong JWT_SECRET in production
- Tokens expire after 24 hours by default
- Guest tokens expire after 30 minutes
- Passwords are hashed using bcrypt with 12 salt rounds

## Integration with Portal

Portal (API Gateway) will validate all incoming requests by:
1. Extracting the Authorization header
2. Calling Shutter's `/api/validate` endpoint
3. Forwarding validated requests to appropriate microservices
4. Rejecting invalid/expired tokens

## Future Enhancements

- API token management (long-lived tokens for programmatic access)
- Token refresh mechanism
- Multi-factor authentication
- Role-based access control (RBAC)
- OAuth2/OIDC support