# Portal REST API Documentation

## Introduction

This document describes the REST API for the Portal component of the Relica system. It follows the standardized documentation format for all APIs in the system.

All REST endpoints are organized by their functional categories and include detailed information about request parameters, response formats, and authentication requirements.

## Endpoint Categories

The Portal REST API endpoints are categorized based on their functional areas:

1. **Authentication Endpoints**: Endpoints for user authentication and token management
2. **Entity Retrieval Endpoints**: Endpoints for retrieving entity information
3. **Search Endpoints**: Endpoints for searching entities and content
4. **Model Endpoints**: Endpoints for accessing model information
5. **Fact Endpoints**: Endpoints for retrieving facts and relationships
6. **Prism Setup Endpoints**: Endpoints for Prism system setup and configuration
7. **System Endpoints**: Endpoints for system health and status

## Endpoint Reference Overview

### Authentication Endpoints

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/ws-auth` | POST | Authenticate with JWT token for WebSocket connections |

### Entity Retrieval Endpoints

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/kinds` | GET | Retrieve all available kinds |
| `/concept/entities` | GET, POST | Resolve UIDs to entity information |
| `/environment/retrieve` | GET | Retrieve environment information |
| `/retrieveEntity/collections` | GET | Retrieve collections |
| `/retrieveEntity/type` | GET | Retrieve entity type information |

### Search Endpoints

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/generalSearch/text` | GET | Search entities by text |
| `/generalSearch/uid` | GET | Search entities by UID |

### Model Endpoints

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/model` | GET | Retrieve model information |
| `/model/kind` | GET | Retrieve kind model information |
| `/model/individual` | GET | Retrieve individual model information |

### Fact Endpoints

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/fact/classified` | GET | Retrieve classification facts |
| `/fact/subtypes` | GET | Retrieve subtype relationships |
| `/fact/subtypes-cone` | GET | Retrieve subtype cone (hierarchy) |

### Prism Setup Endpoints

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/api/prism/setup/status` | GET | Get Prism setup status |
| `/api/prism/setup/start` | POST | Start Prism setup process |
| `/api/prism/setup/user` | POST | Create user during Prism setup |

### System Endpoints

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/health` | GET | Check system health |

## Individual Endpoint Documentation

Below is the detailed documentation for each endpoint supported by the Portal component.

---

## Authentication Endpoints

### `POST /ws-auth`

**Authentication Required**: Yes (JWT)

**Description**:
Authenticates a user with a JWT token for WebSocket connections. This endpoint validates the JWT token and returns a socket token that can be used for subsequent WebSocket requests.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

**Response Format**:
```json
{
  "success": true,
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "user-id": "user-123"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Invalid JWT token"
}
```

**Example Request**:
```
POST /ws-auth HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "user-id": "user-123"
}
```

---

## Entity Retrieval Endpoints

### `GET /kinds`

**Authentication Required**: Yes (JWT)

**Description**:
Retrieves all available kinds in the system. Kinds represent the types of entities that can exist in the system.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

**Response Format**:
```json
{
  "success": true,
  "kinds": [
    {
      "uid": "kind-123",
      "name": "PhysicalObject",
      "description": "A physical object in the system"
    },
    {
      "uid": "kind-456",
      "name": "Occurrence",
      "description": "An occurrence or event in the system"
    }
  ]
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to retrieve kinds"
}
```

**Example Request**:
```
GET /kinds HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "kinds": [
    {
      "uid": "kind-123",
      "name": "PhysicalObject",
      "description": "A physical object in the system"
    },
    {
      "uid": "kind-456",
      "name": "Occurrence",
      "description": "An occurrence or event in the system"
    }
  ]
}
```

### `GET /concept/entities`

**Authentication Required**: Yes (JWT)

**Description**:
Resolves UIDs to entity information. This endpoint takes a list of UIDs and returns detailed information about each entity.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

Query Parameters:
- `uids`: Comma-separated list of UIDs to resolve

**Response Format**:
```json
{
  "success": true,
  "entities": [
    {
      "uid": "entity-123",
      "name": "Example Entity",
      "kind": "PhysicalObject",
      "properties": {
        "property1": "value1",
        "property2": "value2"
      }
    }
  ]
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to resolve entities"
}
```

**Example Request**:
```
GET /concept/entities?uids=entity-123,entity-456 HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "entities": [
    {
      "uid": "entity-123",
      "name": "Example Entity",
      "kind": "PhysicalObject",
      "properties": {
        "property1": "value1",
        "property2": "value2"
      }
    }
  ]
}
```

### `POST /concept/entities`

**Authentication Required**: Yes (JWT)

**Description**:
Resolves UIDs to entity information. This endpoint takes a list of UIDs in the request body and returns detailed information about each entity.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT
- `Content-Type`: application/json

Body:
```json
{
  "uids": ["entity-123", "entity-456"]
}
```

**Response Format**:
```json
{
  "success": true,
  "entities": [
    {
      "uid": "entity-123",
      "name": "Example Entity",
      "kind": "PhysicalObject",
      "properties": {
        "property1": "value1",
        "property2": "value2"
      }
    }
  ]
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to resolve entities"
}
```

**Example Request**:
```
POST /concept/entities HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "uids": ["entity-123", "entity-456"]
}
```

**Example Response**:
```json
{
  "success": true,
  "entities": [
    {
      "uid": "entity-123",
      "name": "Example Entity",
      "kind": "PhysicalObject",
      "properties": {
        "property1": "value1",
        "property2": "value2"
      }
    }
  ]
}
```

### `GET /environment/retrieve`

**Authentication Required**: Yes (JWT)

**Description**:
Retrieves environment information. This endpoint returns information about the current environment, including loaded entities and facts.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

**Response Format**:
```json
{
  "success": true,
  "environment": {
    "entities": [
      {
        "uid": "entity-123",
        "name": "Example Entity"
      }
    ],
    "facts": [
      {
        "uid": "fact-123",
        "subject": "entity-123",
        "predicate": "is-a",
        "object": "kind-123"
      }
    ]
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to retrieve environment"
}
```

**Example Request**:
```
GET /environment/retrieve HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "environment": {
    "entities": [
      {
        "uid": "entity-123",
        "name": "Example Entity"
      }
    ],
    "facts": [
      {
        "uid": "fact-123",
        "subject": "entity-123",
        "predicate": "is-a",
        "object": "kind-123"
      }
    ]
  }
}
```

### `GET /retrieveEntity/collections`

**Authentication Required**: Yes (JWT)

**Description**:
Retrieves collections. This endpoint returns information about collections in the system.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

**Response Format**:
```json
{
  "success": true,
  "collections": [
    {
      "uid": "collection-123",
      "name": "Example Collection",
      "description": "A collection of entities"
    }
  ]
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to retrieve collections"
}
```

**Example Request**:
```
GET /retrieveEntity/collections HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "collections": [
    {
      "uid": "collection-123",
      "name": "Example Collection",
      "description": "A collection of entities"
    }
  ]
}
```

### `GET /retrieveEntity/type`

**Authentication Required**: Yes (JWT)

**Description**:
Retrieves entity type information. This endpoint returns information about the type of an entity.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

Query Parameters:
- `uid`: UID of the entity to get type information for

**Response Format**:
```json
{
  "success": true,
  "type": {
    "uid": "type-123",
    "name": "PhysicalObject",
    "description": "A physical object in the system"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to retrieve entity type"
}
```

**Example Request**:
```
GET /retrieveEntity/type?uid=entity-123 HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "type": {
    "uid": "type-123",
    "name": "PhysicalObject",
    "description": "A physical object in the system"
  }
}
```

---

## Search Endpoints

### `GET /generalSearch/text`

**Authentication Required**: Yes (JWT)

**Description**:
Searches entities by text. This endpoint allows searching for entities based on text content.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

Query Parameters:
- `query`: Text to search for
- `limit` (optional): Maximum number of results to return (default: 10)
- `offset` (optional): Offset for pagination (default: 0)

**Response Format**:
```json
{
  "success": true,
  "results": [
    {
      "uid": "entity-123",
      "name": "Example Entity",
      "kind": "PhysicalObject",
      "score": 0.95
    }
  ],
  "total": 1
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to perform text search"
}
```

**Example Request**:
```
GET /generalSearch/text?query=example&limit=10&offset=0 HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "results": [
    {
      "uid": "entity-123",
      "name": "Example Entity",
      "kind": "PhysicalObject",
      "score": 0.95
    }
  ],
  "total": 1
}
```

### `GET /generalSearch/uid`

**Authentication Required**: Yes (JWT)

**Description**:
Searches entities by UID. This endpoint allows searching for entities based on their UID.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

Query Parameters:
- `uid`: UID to search for

**Response Format**:
```json
{
  "success": true,
  "entity": {
    "uid": "entity-123",
    "name": "Example Entity",
    "kind": "PhysicalObject",
    "properties": {
      "property1": "value1",
      "property2": "value2"
    }
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Entity not found"
}
```

**Example Request**:
```
GET /generalSearch/uid?uid=entity-123 HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "entity": {
    "uid": "entity-123",
    "name": "Example Entity",
    "kind": "PhysicalObject",
    "properties": {
      "property1": "value1",
      "property2": "value2"
    }
  }
}
```

---

## Model Endpoints

### `GET /model`

**Authentication Required**: Yes (JWT)

**Description**:
Retrieves model information. This endpoint returns information about the semantic model.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

**Response Format**:
```json
{
  "success": true,
  "model": {
    "kinds": [
      {
        "uid": "kind-123",
        "name": "PhysicalObject"
      }
    ],
    "relationships": [
      {
        "uid": "relationship-123",
        "name": "is-a"
      }
    ]
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to retrieve model"
}
```

**Example Request**:
```
GET /model HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "model": {
    "kinds": [
      {
        "uid": "kind-123",
        "name": "PhysicalObject"
      }
    ],
    "relationships": [
      {
        "uid": "relationship-123",
        "name": "is-a"
      }
    ]
  }
}
```

### `GET /model/kind`

**Authentication Required**: Yes (JWT)

**Description**:
Retrieves kind model information. This endpoint returns information about a specific kind model.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

Query Parameters:
- `uid`: UID of the kind to get model information for

**Response Format**:
```json
{
  "success": true,
  "kind": {
    "uid": "kind-123",
    "name": "PhysicalObject",
    "description": "A physical object in the system",
    "properties": [
      {
        "name": "weight",
        "type": "number",
        "required": false
      }
    ]
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Kind not found"
}
```

**Example Request**:
```
GET /model/kind?uid=kind-123 HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "kind": {
    "uid": "kind-123",
    "name": "PhysicalObject",
    "description": "A physical object in the system",
    "properties": [
      {
        "name": "weight",
        "type": "number",
        "required": false
      }
    ]
  }
}
```

### `GET /model/individual`

**Authentication Required**: Yes (JWT)

**Description**:
Retrieves individual model information. This endpoint returns model information for a specific individual entity.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

Query Parameters:
- `uid`: UID of the individual to get model information for

**Response Format**:
```json
{
  "success": true,
  "individual": {
    "uid": "entity-123",
    "name": "Example Entity",
    "kind": "PhysicalObject",
    "properties": {
      "weight": 10.5
    }
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Individual not found"
}
```

**Example Request**:
```
GET /model/individual?uid=entity-123 HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "individual": {
    "uid": "entity-123",
    "name": "Example Entity",
    "kind": "PhysicalObject",
    "properties": {
      "weight": 10.5
    }
  }
}
```

---

## Fact Endpoints

### `GET /fact/classified`

**Authentication Required**: Yes (JWT)

**Description**:
Retrieves classification facts. This endpoint returns facts about entity classifications.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

Query Parameters:
- `uid`: UID of the entity to get classification facts for

**Response Format**:
```json
{
  "success": true,
  "facts": [
    {
      "uid": "fact-123",
      "subject": "entity-123",
      "predicate": "is-a",
      "object": "kind-123"
    }
  ]
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to retrieve classification facts"
}
```

**Example Request**:
```
GET /fact/classified?uid=entity-123 HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "facts": [
    {
      "uid": "fact-123",
      "subject": "entity-123",
      "predicate": "is-a",
      "object": "kind-123"
    }
  ]
}
```

### `GET /fact/subtypes`

**Authentication Required**: Yes (JWT)

**Description**:
Retrieves subtype relationships. This endpoint returns facts about entity subtype relationships.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

Query Parameters:
- `uid`: UID of the entity to get subtype relationships for

**Response Format**:
```json
{
  "success": true,
  "subtypes": [
    {
      "uid": "entity-456",
      "name": "Subtype Entity",
      "kind": "PhysicalObject"
    }
  ]
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to retrieve subtype relationships"
}
```

**Example Request**:
```
GET /fact/subtypes?uid=entity-123 HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "subtypes": [
    {
      "uid": "entity-456",
      "name": "Subtype Entity",
      "kind": "PhysicalObject"
    }
  ]
}
```

### `GET /fact/subtypes-cone`

**Authentication Required**: Yes (JWT)

**Description**:
Retrieves subtype cone (hierarchy). This endpoint returns the complete hierarchy of subtypes for an entity.

**Request Parameters**:

Headers:
- `Authorization`: Bearer token containing the JWT

Query Parameters:
- `uid`: UID of the entity to get subtype cone for

**Response Format**:
```json
{
  "success": true,
  "cone": {
    "uid": "entity-123",
    "name": "Example Entity",
    "subtypes": [
      {
        "uid": "entity-456",
        "name": "Subtype Entity",
        "subtypes": [
          {
            "uid": "entity-789",
            "name": "Sub-subtype Entity",
            "subtypes": []
          }
        ]
      }
    ]
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to retrieve subtype cone"
}
```

**Example Request**:
```
GET /fact/subtypes-cone?uid=entity-123 HTTP/1.1
Host: api.relica.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response**:
```json
{
  "success": true,
  "cone": {
    "uid": "entity-123",
    "name": "Example Entity",
    "subtypes": [
      {
        "uid": "entity-456",
        "name": "Subtype Entity",
        "subtypes": [
          {
            "uid": "entity-789",
            "name": "Sub-subtype Entity",
            "subtypes": []
          }
        ]
      }
    ]
  }
}
```

---

## Prism Setup Endpoints

### `GET /api/prism/setup/status`

**Authentication Required**: No

**Description**:
Gets Prism setup status. This endpoint returns information about the current status of the Prism setup process.

**Request Parameters**:

None

**Response Format**:
```json
{
  "success": true,
  "status": {
    "stage": "initial",
    "completed": false,
    "steps": [
      {
        "name": "database",
        "completed": false
      },
      {
        "name": "user",
        "completed": false
      }
    ]
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to retrieve setup status"
}
```

**Example Request**:
```
GET /api/prism/setup/status HTTP/1.1
Host: api.relica.io
```

**Example Response**:
```json
{
  "success": true,
  "status": {
    "stage": "initial",
    "completed": false,
    "steps": [
      {
        "name": "database",
        "completed": false
      },
      {
        "name": "user",
        "completed": false
      }
    ]
  }
}
```

### `POST /api/prism/setup/start`

**Authentication Required**: No

**Description**:
Starts Prism setup process. This endpoint initiates the Prism setup process.

**Request Parameters**:

Headers:
- `Content-Type`: application/json

Body:
```json
{
  "config": {
    "database": {
      "host": "localhost",
      "port": 5432,
      "username": "postgres",
      "password": "password",
      "database": "prism"
    }
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "Setup process started",
  "status": {
    "stage": "database",
    "completed": false
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to start setup process"
}
```

**Example Request**:
```
POST /api/prism/setup/start HTTP/1.1
Host: api.relica.io
Content-Type: application/json

{
  "config": {
    "database": {
      "host": "localhost",
      "port": 5432,
      "username": "postgres",
      "password": "password",
      "database": "prism"
    }
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "Setup process started",
  "status": {
    "stage": "database",
    "completed": false
  }
}
```

### `POST /api/prism/setup/user`

**Authentication Required**: No

**Description**:
Creates user during Prism setup. This endpoint creates an admin user during the Prism setup process.

**Request Parameters**:

Headers:
- `Content-Type`: application/json

Body:
```json
{
  "username": "admin",
  "password": "password",
  "email": "admin@example.com"
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "User created",
  "status": {
    "stage": "user",
    "completed": true
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Failed to create user"
}
```

**Example Request**:
```
POST /api/prism/setup/user HTTP/1.1
Host: api.relica.io
Content-Type: application/json

{
  "username": "admin",
  "password": "password",
  "email": "admin@example.com"
}
```

**Example Response**:
```json
{
  "success": true,
  "message": "User created",
  "status": {
    "stage": "user",
    "completed": true
  }
}
```

---

## System Endpoints

### `GET /health`

**Authentication Required**: No

**Description**:
Checks system health. This endpoint returns a simple response indicating that the system is healthy.

**Request Parameters**:

None

**Response Format**:
```
healthy
```

**Example Request**:
```
GET /health HTTP/1.1
Host: api.relica.io
```

**Example Response**:
```
healthy
```

---

## CORS Support

All endpoints in the Portal REST API support CORS (Cross-Origin Resource Sharing) with the following headers:

- `Access-Control-Allow-Origin`: *
- `Access-Control-Allow-Methods`: GET, POST, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization
- `Access-Control-Max-Age`: 3600

OPTIONS requests to any endpoint will return a 200 OK response with these CORS headers.