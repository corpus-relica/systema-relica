# API Token Management

This document describes the API token management feature added to the Shutter authentication service.

## Overview

API tokens provide a way for users and applications to authenticate with the Relica system programmatically. Unlike JWT tokens which are short-lived and meant for session-based authentication, API tokens are long-lived and designed for automated systems, CI/CD pipelines, and other programmatic access scenarios.

## Features

### Core Features (Implemented)
- **Token Generation**: Secure random tokens with `srt_` prefix and ID-based format (`srt_randompart.id`)
- **Token Storage**: Bcrypt hashed tokens stored in database
- **Token Management**: Create, list, and revoke tokens via REST API
- **Rate Limiting**: Maximum 10 tokens per user
- **Token Validation**: Internal endpoint for service-to-service validation with optimized lookup
- **Basic Scopes**: Simple read/write permission system
- **Expiration Support**: Optional token expiration dates
- **Usage Tracking**: Last used timestamp tracking
- **Performance Optimization**: Direct token lookup by ID component

### Security Features
- Tokens are shown only once during creation
- All tokens are stored as bcrypt hashes
- Tokens can be revoked (soft delete)
- Token format validation (`srt_` prefix required)
- ID-based format enables efficient token lookup
- Rate limiting prevents token spam

## API Endpoints

### Create Token
```bash
POST /api/tokens/create
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Production API Token",
  "description": "Used for production deployments",
  "scopes": ["read", "write"],
  "expires_in_days": 365
}
```

### List Tokens
```bash
GET /api/tokens
Authorization: Bearer <JWT_TOKEN>
```

### Revoke Token
```bash
DELETE /api/tokens/:id
Authorization: Bearer <JWT_TOKEN>
```

### Validate Token (Internal Use)
```bash
POST /api/validate-token
Authorization: Bearer srt_<RANDOM_PART>.<TOKEN_ID>
```

## Usage Examples

### Creating a Token
```bash
# First, authenticate to get a JWT
JWT=$(curl -X POST http://localhost:2173/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.token')

# Create an API token
curl -X POST http://localhost:2173/api/tokens/create \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My API Token",
    "description": "For automated testing",
    "scopes": ["read", "write"],
    "expires_in_days": 90
  }'
```

### Using an API Token
```bash
# Use the token with Portal or other services
curl -X GET http://localhost:3000/api/some-endpoint \
  -H "Authorization: Bearer srt_your_token_part.123"
```

## Portal Integration

The Portal service needs to be updated to accept API tokens in addition to JWT tokens. The authentication middleware should:

1. Check for `Bearer srt_` tokens in the Authorization header
2. Call Shutter's `/api/validate-token` endpoint
3. Cache validation results for performance

Example Portal middleware update:
```javascript
if (token.startsWith('srt_')) {
  // Validate API token via Shutter
  const validation = await validateApiToken(token);
  if (validation.valid) {
    req.user = { id: validation.user_id, scopes: validation.scopes };
  }
}
```

## Database Schema

```sql
CREATE TABLE access_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scopes TEXT[],
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
```

## Testing

Run the token tests:
```bash
cd packages_clj/shutter
clojure -M:test
```

## Future Enhancements

The following features are planned for future releases:
- Complex permission scopes
- Token rotation capabilities
- IP allowlisting per token
- Usage quotas and rate limiting
- Detailed audit logging
- Token validation caching
- Monitoring for suspicious patterns

## Performance Improvements

### ID-Based Token Format
The API token format has been enhanced to include an ID component: `srt_randompart.id`. This format provides:

1. **Direct Database Lookup**: Tokens can be looked up directly by their ID instead of comparing hashes of all tokens
2. **Reduced Database Load**: Minimizes the need for expensive bcrypt comparisons across multiple tokens
3. **Faster Validation**: Significantly improves response time for high-frequency token validation requests
4. **Scalability**: Maintains performance even with large numbers of tokens in the system

### Token Validation Process
The updated token validation process:

1. Extracts the token ID from the provided token (the part after the dot)
2. Performs a direct database lookup using that ID
3. Verifies the full token string against the stored hash
4. Updates the last_used_at timestamp only for the specific token

This approach eliminates the need to scan through all tokens and drastically reduces CPU usage for bcrypt hash comparisons.