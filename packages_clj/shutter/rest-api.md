# Shutter REST API Documentation

## Introduction

This document describes the REST API for the Shutter component of the Relica system. It follows the standardized documentation format for all APIs in the system.

All REST endpoints are organized by their functional categories and include detailed information about request parameters, response formats, and authentication requirements.

## Endpoint Categories

The Shutter REST API endpoints are categorized based on their functional areas:

1. **Authentication Endpoints**: Endpoints for user authentication and token management
2. **System Endpoints**: Endpoints for system health and status

## Endpoint Reference Overview

### Authentication Endpoints

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/api/login` | POST | Authenticate user and obtain JWT token |
| `/api/guest-auth` | POST | Obtain a limited guest token for setup process |
| `/api/validate` | POST | Validate an existing JWT token |
| `/auth/profile` | GET | Retrieve user profile information |
| `/api/tokens/create` | POST | Create a new API access token |
| `/api/tokens` | GET | List all active tokens for authenticated user |
| `/api/tokens/:id` | DELETE | Revoke an API access token |
| `/api/validate-token` | POST | Validate an API access token (internal use) |

### System Endpoints

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/health` | GET | Check system health |

## Individual Endpoint Documentation

Below is the detailed documentation for each endpoint supported by the Shutter component.

---

## Authentication Endpoints

### `POST /api/login`

**Authentication Required**: No

**Description**:
Authenticates a user with email and password credentials and returns a JWT token for subsequent API requests.

**Request Parameters**:

Headers:
- `Content-Type`: application/json

Body:
```json
{
  "email": "user@example.com",
  "password": "user_password"
}
```

**Response Format**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "username": "username",
    "email": "user@example.com",
    "is_admin": false
  }
}
```

**Error Response**:
```json
{
  "error": "Invalid credentials"
}
```

**Example Request**:
```
POST /api/login HTTP/1.1
Host: api.relica.io
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "user_password"
}
```

**Example Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "username": "username",
    "email": "user@example.com",
    "is_admin": false
  }
}
```

### `POST /api/guest-auth`

**Authentication Required**: No

**Description**:
Provides a limited JWT token for the setup process. This token has minimal permissions and a short expiration time (30 minutes).

**Request Parameters**:

Headers:
- `Content-Type`: application/json

**Response Format**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "guest",
    "username": "guest",
    "roles": ["setup"]
  }
}
```

**Error Response**:
```json
{
  "error": "Guest authentication failed"
}
```

**Example Request**:
```
POST /api/guest-auth HTTP/1.1
Host: api.relica.io
Content-Type: application/json
```

**Example Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "guest",
    "username": "guest",
    "roles": ["setup"]
  }
}
```

### `POST /api/validate`

**Authentication Required**: Yes (JWT)

**Description**:
Validates an existing JWT token and returns the identity information contained in the token.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT
- `Content-Type`: application/json

**Response Format**:
```json
{
  "message": "Token valid",
  "identity": {
    "user-id": 123,
    "email": "user@example.com",
    "admin": false
  }
}
```

**Error Response**:
```json
{
  "error": "Authentication failed"
}
```

**Example Request**:
```
POST /api/validate HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Example Response**:
```json
{
  "message": "Token valid",
  "identity": {
    "user-id": 123,
    "email": "user@example.com",
    "admin": false
  }
}
```

### `GET /auth/profile`

**Authentication Required**: Yes (JWT)

**Description**:
Retrieves the profile information of the authenticated user.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

**Response Format**:
```json
{
  "sub": "123",
  "username": "user@example.com"
}
```

**Error Response**:
```json
{
  "error": "Authentication failed"
}
```

**Example Request**:
```
GET /auth/profile HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "sub": "123",
  "username": "user@example.com"
}
```

### `POST /api/tokens/create`

**Authentication Required**: Yes (JWT)

**Description**:
Creates a new API access token for programmatic access to the Relica system. The token is shown only once during creation and must be stored securely by the user.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT
- `Content-Type`: application/json

Body:
```json
{
  "name": "My API Token",
  "description": "Token for CI/CD pipeline",
  "scopes": ["read", "write"],
  "expires_in_days": 90
}
```

**Response Format**:
```json
{
  "token": "srt_1234567890abcdef...",
  "token_info": {
    "id": 1,
    "name": "My API Token",
    "description": "Token for CI/CD pipeline",
    "scopes": ["read", "write"],
    "expires_at": "2025-08-25T00:00:00Z",
    "created_at": "2025-05-26T00:00:00Z"
  }
}
```

**Error Response**:
```json
{
  "error": "Token limit exceeded. Maximum 10 tokens allowed per user."
}
```

**Example Request**:
```
POST /api/tokens/create HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Production API Token",
  "description": "Used for production deployments",
  "scopes": ["read", "write"],
  "expires_in_days": 365
}
```

### `GET /api/tokens`

**Authentication Required**: Yes (JWT)

**Description**:
Lists all active API access tokens for the authenticated user. Token values are never shown in the response for security reasons.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

**Response Format**:
```json
{
  "tokens": [
    {
      "id": 1,
      "name": "My API Token",
      "description": "Token for CI/CD pipeline",
      "scopes": ["read", "write"],
      "last_used_at": "2025-05-26T12:00:00Z",
      "expires_at": "2025-08-25T00:00:00Z",
      "created_at": "2025-05-26T00:00:00Z"
    }
  ]
}
```

**Example Request**:
```
GET /api/tokens HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### `DELETE /api/tokens/:id`

**Authentication Required**: Yes (JWT)

**Description**:
Revokes an API access token by marking it as inactive. Only the token owner can revoke their tokens.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

Path Parameters:
- `id`: The ID of the token to revoke

**Response Format**:
```json
{
  "message": "Token revoked successfully"
}
```

**Error Response**:
```json
{
  "error": "Token not found or unauthorized"
}
```

**Example Request**:
```
DELETE /api/tokens/123 HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### `POST /api/validate-token`

**Authentication Required**: No

**Description**:
Validates an API access token. This endpoint is designed for internal service use (e.g., Portal service) to verify API tokens. It accepts the token in the Authorization header and returns validation results.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the API token (format: `Bearer srt_...`)

**Response Format**:
```json
{
  "valid": true,
  "user_id": 123,
  "scopes": ["read", "write"],
  "token_id": 1
}
```

**Error Response**:
```json
{
  "valid": false,
  "error": "Invalid token"
}
```

**Example Request**:
```
POST /api/validate-token HTTP/1.1
Host: api.relica.io
Authorization: Bearer srt_1234567890abcdef...
```

---

## System Endpoints

### `GET /health`

**Authentication Required**: No

**Description**:
Checks the health of the Shutter service and its database connection.

**Request Parameters**: None

**Response Format**:
```json
{
  "status": "healthy",
  "db": "connected"
}
```

**Error Response**:
```json
{
  "status": "unhealthy",
  "db": "disconnected"
}
```

**Example Request**:
```
GET /health HTTP/1.1
Host: api.relica.io
```

**Example Response**:
```json
{
  "status": "healthy",
  "db": "connected"
}
```

## CORS Support

The Shutter API supports Cross-Origin Resource Sharing (CORS) with the following configuration:

- **Allowed Origins**: All origins (for development purposes)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization, Accept
- **Max Age**: 300 seconds

This configuration allows web applications from different domains to interact with the Shutter API.