# Clarity 🔮

**Semantic Model Operations and Quintessential Model Management**

Clarity is the semantic transformation service in the Relica ecosystem, focusing exclusively on semantic model operations based on the Quintessential Model (Physical Object, Aspect, Role, Relation, State/Occurrence). It provides a WebSocket-first API for managing and querying semantic relationships in the knowledge graph.

## Overview

Clarity serves as the Object-Semantic Mapping (OSM) layer, leveraging TypeScript inheritance patterns to mirror semantic inheritance in the knowledge model. It implements the five fundamental entity types of the Quintessential Model and provides operations for both Kind (type definitions) and Individual (instances) entities.

## Features

### 🔮 Quintessential Model Support
- **Physical Objects**: Entities with aspects, roles, parts, and connections
- **Aspects**: Qualitative and quantitative properties with possessors  
- **Roles**: Behavioral patterns required by relations
- **Relations**: Binary relationships with required roles
- **Occurrences**: Events and processes with temporal aspects and involvements

### 🌐 Semantic Operations
- Entity model retrieval (Kind/Individual/Qualification)
- Semantic relationship traversal
- Definition and collection management
- Batch model operations
- Fact pattern querying

### 🔌 WebSocket-First API
- Real-time semantic model operations
- Standardized message patterns: `:clarity.{resource}/{action}`
- Error handling with success/failure responses
- Direct return values (no manual message sending)

### 🧠 AI Integration
- OpenAI-powered definition generation
- Specialization hierarchy analysis
- Semantic relationship inference

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Clarity Service                       │
├─────────────────────┬─────────────────┬─────────────────────┤
│   WebSocket Gateway │   Model Service │  Archivist Service  │
│                     │                 │                     │
│ ∙ clarity.model/*   │ ∙ Quintessential│ ∙ Graph queries     │
│ ∙ clarity.kind/*    │   Model ops     │ ∙ Fact retrieval    │  
│ ∙ clarity.facts/*   │ ∙ Inheritance   │ ∙ Entity operations │
│ ∙ Error handling    │   patterns      │ ∙ HTTP client       │
└─────────────────────┴─────────────────┴─────────────────────┘
                               │
                    ┌─────────────────────┐
                    │   Knowledge Graph   │
                    │    (via Archivist)  │
                    └─────────────────────┘
```

## Installation

```bash
# Install dependencies
yarn install

# Build the service
yarn build
```

## Configuration

Environment variables:
```bash
# Database connections (inherited from main environment)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=postgres

# Service configuration  
RELICA_CLARITY_API_PORT=3001
NODE_ENV=development

# External services
ARCHIVIST_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_key
```

## Running the Service

### Development
```bash
yarn start:dev
```

### Production
```bash
yarn start:prod
```

### Docker
```bash
# Development
docker-compose up clarity

# Production
docker-compose -f docker-compose.prod.yml up clarity
```

## API Documentation

### WebSocket API Reference

Connect to: `ws://localhost:3001`

#### Model Operations
```javascript
// Get single model
socket.emit('clarity.model/get', { uid: 123456 })

// Get multiple models  
socket.emit('clarity.model/get-batch', { uids: [123, 456, 789] })

// Get kind-specific model
socket.emit('clarity.kind/get', { uid: 123456 })

// Get individual-specific model
socket.emit('clarity.individual/get', { uid: 123456 })
```

#### Model Updates
```javascript
// Update definition
socket.emit('clarity.model/update-definition', {
  uid: 123456,
  partial_definition: 'Brief description',
  full_definition: 'Complete detailed definition'
})

// Update name
socket.emit('clarity.model/update-name', {
  uid: 123456,
  name: 'New Entity Name'
})

// Update collection
socket.emit('clarity.model/update-collection', {
  fact_uid: 789,
  collection_uid: 456,
  collection_name: 'New Collection'
})
```

#### Quintessential Model Operations
```javascript
// Physical object model
socket.emit('clarity.quintessential/get-physical-object', { uid: 123456 })

// Aspect model  
socket.emit('clarity.quintessential/get-aspect', { uid: 123456 })

// Role model
socket.emit('clarity.quintessential/get-role', { uid: 123456 })

// Relation model
socket.emit('clarity.quintessential/get-relation', { uid: 123456 })

// Occurrence model
socket.emit('clarity.quintessential/get-occurrence', { uid: 123456 })
```

#### Fact Operations
```javascript
// Get all facts for entity
socket.emit('clarity.facts/get-by-entity', { uid: 123456 })
```

### Response Format
All WebSocket messages return standardized responses:
```javascript
// Success response
{
  success: true,
  data: { /* model or operation result */ }
}

// Error response  
{
  success: false,
  error: "Error message description"
}
```

## Quintessential Model Guide

### Entity Natures
- **Kind**: Type definitions (e.g., "Person", "Car", "Marriage")
- **Individual**: Specific instances (e.g., "John Smith", "My Toyota", "John's marriage to Jane") 
- **Qualification**: Values and measurements

### Entity Categories

#### Physical Object
Concrete entities that can have aspects, play roles, and be composed of parts.
```javascript
{
  uid: 123456,
  category: "physical object", 
  name: "Automobile",
  aspects: [{ uid: 789, name: "Color", relation_uid: 1234 }],
  roles: [{ uid: 456, name: "Vehicle", relation_uid: 5678 }],
  components: [{ uid: 321, name: "Engine", relation_uid: 9012 }],
  connections: [{ uid: 654, name: "Fuel Tank", relation_uid: 3456 }]
}
```

#### Aspect  
Properties that entities can possess, either qualitative or quantitative.
```javascript
{
  uid: 789,
  category: "aspect",
  name: "Mass",
  possessors: [{ uid: 123, name: "Physical Object", relation_uid: 1234 }],
  isQuantitative: true,
  unitOfMeasure: { uid: 456, name: "Kilogram" }
}
```

#### Role
Behavioral patterns that entities can fulfill in relations.
```javascript
{
  uid: 456, 
  category: "role",
  name: "Buyer",
  rolePlayers: [{ uid: 123, name: "Person", relation_uid: 1234 }],
  requiredInRelations: [{ uid: 789, name: "Purchase", role_position: 1 }]
}
```

#### Relation
Binary relationships connecting two entities through roles.
```javascript
{
  uid: 789,
  category: "relation", 
  name: "Purchase",
  requiredRole1: { uid: 456, name: "Buyer" },
  requiredRole2: { uid: 654, name: "Seller" },
  inverseRelation: { uid: 321, name: "Sale" }
}
```

#### Occurrence
Events, processes, or states with temporal aspects.
```javascript
{
  uid: 321,
  category: "occurrence",
  name: "Birthday Party",
  aspects: [{ uid: 789, name: "Duration", relation_uid: 1234 }],
  involved: [{ uid: 456, name: "John Smith", relation_uid: 5644 }],
  temporalAspects: {
    beginTime: { uid: 111, name: "Start Time", value: "2024-01-15T18:00:00Z" },
    endTime: { uid: 222, name: "End Time", value: "2024-01-15T22:00:00Z" },
    duration: { uid: 333, name: "Duration", value: "4 hours" }
  }
}
```

## Development

### Project Structure
```
src/
├── events/           # WebSocket gateway and handlers
├── model/           # Core semantic model operations
├── archivist/       # Knowledge graph data access
├── artificialIntelligence/  # AI-powered operations
├── modelling/       # Workflow management (evaluation pending)
└── main.ts         # Service entry point
```

### Key Components

- **EventsGateway**: WebSocket message handling and routing
- **ModelService**: Quintessential Model operations and inheritance patterns  
- **ArchivistService**: HTTP client for knowledge graph access
- **ArtificialIntelligenceService**: OpenAI integration (temporary, moving to NOUS)

### Testing
```bash
# Unit tests
yarn test

# End-to-end tests  
yarn test:e2e

# Test coverage
yarn test:cov
```

### Code Style
```bash
# Lint code
yarn lint

# Format code
yarn format
```

## Integration

Clarity integrates with other Relica services:

- **Archivist**: Knowledge graph data access and fact storage
- **Portal**: API gateway routing WebSocket connections
- **Knowledge Integrator**: Frontend consumption of semantic models
- **NOUS**: AI-powered semantic operations (future)

## Semantic Relationship Constants

```typescript
const RELATION_UID_TO_SEMANTIC = {
  1146: 'specialization-of',   // Inheritance hierarchy
  1225: 'classification',      // Kind-individual relationships  
  1981: 'synonym',            // Alternative names
  1986: 'inverse',            // Inverse relations
  4731: 'required-role-1',    // First role in relation
  4733: 'required-role-2',    // Second role in relation
  5025: 'value',              // Qualification values
  5644: 'involves',           // Occurrence involvements
  4714: 'possible-role',      // Optional roles
} as const;
```

## Contributing

1. Follow semantic commit conventions with emoji prefixes
2. Ensure TypeScript compilation passes: `yarn build`
3. Add comprehensive tests for new functionality
4. Update documentation for API changes
5. Follow the existing code patterns for consistency

## License

This project is part of the Relica ecosystem. See the main repository for license information.

---

**Clarity** - Transforming complex semantic relationships into clear, accessible patterns. 🔮✨