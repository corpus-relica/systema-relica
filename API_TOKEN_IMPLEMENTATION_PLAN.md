# API Token Management Implementation Plan

## Issue Reference
GitHub Issue #74: Add API Access Token Management to Shutter Service

## Branch Information
- Base branch: `develop`
- Feature branch to create: `feature/74-api-token-management`

## Implementation Overview

### Phase 1: Database Setup

1. Create migration file: `packages_clj/shutter/resources/migrations/001-add-access-tokens.sql`
```sql
CREATE TABLE public.access_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scopes TEXT[], -- Simple read/write scopes
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_access_tokens_user_id ON public.access_tokens(user_id);
CREATE INDEX idx_access_tokens_token_hash ON public.access_tokens(token_hash);
```

### Phase 2: Core Implementation Files

1. **Create `packages_clj/shutter/src/io/relica/shutter/db.clj`**
   - Database connection and query functions
   - Token CRUD operations

2. **Create `packages_clj/shutter/src/io/relica/shutter/tokens.clj`**
   - Token generation logic
   - Token validation logic
   - Bcrypt hashing utilities

3. **Update `packages_clj/shutter/src/io/relica/shutter/core.clj`**
   - Add new routes for token endpoints
   - Integrate token validation

### Phase 3: API Endpoints

#### POST /api/tokens/create
- Requires JWT authentication
- Creates new API token with name and optional description
- Returns unhashed token (only shown once)

#### GET /api/tokens
- Requires JWT authentication
- Lists all active tokens for authenticated user
- Never shows actual token values

#### DELETE /api/tokens/:id
- Requires JWT authentication
- Soft deletes token (marks as inactive)
- Verifies ownership before deletion

#### POST /api/validate-token
- No JWT required (for internal service use)
- Validates API token from Authorization header
- Updates last_used_at timestamp
- Returns user info and scopes

### Phase 4: Portal Integration

Update Portal's authentication middleware to:
1. Accept both JWT and API tokens (Bearer srt_xxx format)
2. Call Shutter's /api/validate-token endpoint
3. Cache validation results with short TTL

### Phase 5: Testing

1. Unit tests for token generation and validation
2. Integration tests for all endpoints
3. Security tests for token handling

### Phase 6: Documentation

1. Update `packages_clj/shutter/rest-api.md`
2. Create API token usage guide
3. Update Portal authentication docs

## Security Considerations

1. Tokens prefixed with `srt_` for easy identification
2. Bcrypt hashing for secure storage
3. Tokens shown only once during creation
4. Rate limiting on token creation endpoint
5. Token usage logging for audit trail

## Commands to Execute

```bash
# Create feature branch
git checkout -b feature/74-api-token-management

# Create necessary directories
mkdir -p packages_clj/shutter/resources/migrations

# Start implementation...
```

## Next Steps

1. Switch to code mode
2. Create the feature branch
3. Begin implementation starting with database migration