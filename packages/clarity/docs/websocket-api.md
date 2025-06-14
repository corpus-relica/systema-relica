# Clarity WebSocket API Reference

This document provides comprehensive reference for Clarity's WebSocket API, which handles all semantic model operations and Quintessential Model management.

## Connection

Connect to the Clarity WebSocket server:

```javascript
const socket = io('ws://localhost:3001');
```

## Message Format

All messages follow the standardized pattern: `:clarity.{resource}/{action}`

### Request Format
```javascript
socket.emit('message-type', payload);
```

### Response Format
All responses follow a consistent structure:

```javascript
// Success Response
{
  success: true,
  data: { /* operation result */ }
}

// Error Response
{
  success: false,
  error: "Detailed error message"
}
```

## API Reference

### Model Operations

#### `clarity.model/get`
Retrieve a single entity model by UID.

**Request:**
```javascript
socket.emit('clarity.model/get', { uid: 123456 });
```

**Response:**
```javascript
{
  success: true,
  data: {
    uid: 123456,
    name: "Automobile",
    type: "kind", // or "individual"
    category: "physical object",
    collection: { uid: 789, name: "Vehicles" },
    definition: [
      {
        fact_uid: 456,
        partial_definition: "A motor vehicle",
        full_definition: "A motor vehicle with four wheels..."
      }
    ],
    facts: [...], // All related facts
    // Semantic relationships
    1146: [654], // specialization-of UIDs
    1225: [321], // classification UIDs
    // ... additional semantic mappings
  }
}
```

#### `clarity.model/get-batch`
Retrieve multiple entity models by UIDs.

**Request:**
```javascript
socket.emit('clarity.model/get-batch', { 
  uids: [123456, 789012, 345678] 
});
```

**Response:**
```javascript
{
  success: true,
  data: [
    { /* model 1 */ },
    { /* model 2 */ },
    { /* model 3 */ }
  ]
}
```

#### `clarity.kind/get`
Retrieve a kind (type definition) model with specialized operations.

**Request:**
```javascript
socket.emit('clarity.kind/get', { uid: 123456 });
```

**Response:**
```javascript
{
  success: true,
  data: {
    uid: 123456,
    name: "Person",
    type: "kind",
    category: "physical object",
    // Kind-specific attributes
    definitions: [...],
    supertypes: [654321],
    // Specialized category model
    aspects: [...],
    roles: [...],
    // ... category-specific attributes
  }
}
```

#### `clarity.individual/get`
Retrieve an individual (instance) model.

**Request:**
```javascript
socket.emit('clarity.individual/get', { uid: 789012 });
```

**Response:**
```javascript
{
  success: true,
  data: {
    uid: 789012,
    name: "John Smith",
    type: "individual", 
    category: "physical object",
    // Individual-specific attributes
    classifiers: [123456], // Kinds this individual instantiates
    // ... instance-specific data
  }
}
```

### Model Update Operations

#### `clarity.model/update-definition`
Update entity definition with partial and full descriptions.

**Request:**
```javascript
socket.emit('clarity.model/update-definition', {
  uid: 123456,
  partial_definition: "Brief description",
  full_definition: "Complete detailed definition with context..."
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    fact_uid: 789,
    updated: true,
    partial_definition: "Brief description",
    full_definition: "Complete detailed definition with context..."
  }
}
```

#### `clarity.model/update-name`
Update entity name.

**Request:**
```javascript
socket.emit('clarity.model/update-name', {
  uid: 123456,
  name: "Updated Entity Name"
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    fact_uid: 456,
    updated: true,
    name: "Updated Entity Name"
  }
}
```

#### `clarity.model/update-collection`
Update entity collection assignment.

**Request:**
```javascript
socket.emit('clarity.model/update-collection', {
  fact_uid: 789,
  collection_uid: 456,
  collection_name: "New Collection Name"
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    fact_uid: 789,
    updated: true,
    collection_uid: 456,
    collection_name: "New Collection Name"
  }
}
```

### Quintessential Model Operations

#### `clarity.quintessential/get-physical-object`
Retrieve physical object model with aspects, roles, components, and connections.

**Request:**
```javascript
socket.emit('clarity.quintessential/get-physical-object', { uid: 123456 });
```

**Response:**
```javascript
{
  success: true,
  data: {
    uid: 123456,
    category: "physical object",
    name: "Automobile",
    aspects: [
      { uid: 789, name: "Color", relation_uid: 1234 },
      { uid: 012, name: "Mass", relation_uid: 5678 }
    ],
    roles: [
      { uid: 345, name: "Vehicle", relation_uid: 9012 }
    ],
    components: [
      { uid: 678, name: "Engine", relation_uid: 3456 },
      { uid: 901, name: "Wheel", relation_uid: 7890 }
    ],
    connections: [
      { uid: 234, name: "Fuel Tank", relation_uid: 1357 }
    ],
    facts: [...] // All related facts
  }
}
```

#### `clarity.quintessential/get-aspect`
Retrieve aspect model with possessors and quantitative properties.

**Request:**
```javascript
socket.emit('clarity.quintessential/get-aspect', { uid: 789012 });
```

**Response:**
```javascript
{
  success: true,
  data: {
    uid: 789012,
    category: "aspect",
    name: "Mass",
    possessors: [
      { uid: 123, name: "Physical Object", relation_uid: 1234 }
    ],
    isQuantitative: true,
    unitOfMeasure: {
      uid: 456,
      name: "Kilogram"
    },
    facts: [...]
  }
}
```

#### `clarity.quintessential/get-role`
Retrieve role model with role players and required relations.

**Request:**
```javascript
socket.emit('clarity.quintessential/get-role', { uid: 345678 });
```

**Response:**
```javascript
{
  success: true,
  data: {
    uid: 345678,
    category: "role",
    name: "Buyer",
    rolePlayers: [
      { uid: 123, name: "Person", relation_uid: 1234 }
    ],
    requiredInRelations: [
      { uid: 789, name: "Purchase", role_position: 1 },
      { uid: 012, name: "Transaction", role_position: 2 }
    ],
    facts: [...]
  }
}
```

#### `clarity.quintessential/get-relation`
Retrieve relation model with required roles and inverse relations.

**Request:**
```javascript
socket.emit('clarity.quintessential/get-relation', { uid: 901234 });
```

**Response:**
```javascript
{
  success: true,
  data: {
    uid: 901234,
    category: "relation",
    name: "Purchase",
    requiredRole1: {
      uid: 345,
      name: "Buyer"
    },
    requiredRole2: {
      uid: 678,
      name: "Seller"
    },
    inverseRelation: {
      uid: 567,
      name: "Sale"
    },
    facts: [...]
  }
}
```

#### `clarity.quintessential/get-occurrence`
Retrieve occurrence model with aspects, involved entities, and temporal information.

**Request:**
```javascript
socket.emit('clarity.quintessential/get-occurrence', { uid: 567890 });
```

**Response:**
```javascript
{
  success: true,
  data: {
    uid: 567890,
    category: "occurrence", 
    name: "Birthday Party",
    aspects: [
      { uid: 123, name: "Duration", relation_uid: 1234 },
      { uid: 456, name: "Location", relation_uid: 5678 }
    ],
    involved: [
      { uid: 789, name: "John Smith", relation_uid: 5644 },
      { uid: 012, name: "Jane Doe", relation_uid: 5644 }
    ],
    temporalAspects: {
      beginTime: {
        uid: 111,
        name: "Start Time",
        value: "2024-01-15T18:00:00Z"
      },
      endTime: {
        uid: 222,
        name: "End Time", 
        value: "2024-01-15T22:00:00Z"
      },
      duration: {
        uid: 333,
        name: "Duration",
        value: "4 hours"
      }
    },
    facts: [...]
  }
}
```

### Fact Operations

#### `clarity.facts/get-by-entity`
Retrieve all facts related to a specific entity.

**Request:**
```javascript
socket.emit('clarity.facts/get-by-entity', { uid: 123456 });
```

**Response:**
```javascript
{
  success: true,
  data: [
    {
      fact_uid: 789,
      lh_object_uid: 123456,
      lh_object_name: "Automobile",
      rel_type_uid: 1146,
      rel_type_name: "is a specialization of",
      rh_object_uid: 654321,
      rh_object_name: "Vehicle",
      partial_definition: "...",
      full_definition: "..."
    },
    // ... more facts
  ]
}
```

## Error Handling

All operations include comprehensive error handling:

### Common Error Types

#### Invalid UID
```javascript
{
  success: false,
  error: "Entity with UID 123456 not found"
}
```

#### Missing Parameters
```javascript
{
  success: false,
  error: "Required parameter 'uid' not provided"
}
```

#### Service Unavailable
```javascript
{
  success: false,
  error: "Archivist service unavailable"
}
```

#### Invalid Data Format
```javascript
{
  success: false,
  error: "Invalid data format for definition update"
}
```

## Usage Examples

### Client Connection and Basic Operations

```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:3001');

// Connection handlers
socket.on('connect', () => {
  console.log('Connected to Clarity service');
});

socket.on('disconnect', () => {
  console.log('Disconnected from Clarity service');
});

// Get a physical object model
socket.emit('clarity.quintessential/get-physical-object', { uid: 730044 });

socket.on('clarity.quintessential/get-physical-object', (response) => {
  if (response.success) {
    console.log('Physical Object Model:', response.data);
    // Process the model data
    const { aspects, roles, components } = response.data;
    // ... handle the semantic model
  } else {
    console.error('Error:', response.error);
  }
});

// Update entity definition
socket.emit('clarity.model/update-definition', {
  uid: 123456,
  partial_definition: 'A motor vehicle',
  full_definition: 'A motor vehicle with four wheels designed for transportation'
});

// Batch retrieve multiple models
socket.emit('clarity.model/get-batch', { 
  uids: [730044, 790229, 160170] // Physical object, aspect, role
});

socket.on('clarity.model/get-batch', (response) => {
  if (response.success) {
    response.data.forEach(model => {
      console.log(`Model ${model.uid}: ${model.name} (${model.category})`);
    });
  }
});
```

### Error Handling Pattern

```javascript
// Standardized error handling
function handleClarityResponse(response, successCallback) {
  if (response.success) {
    successCallback(response.data);
  } else {
    console.error('Clarity operation failed:', response.error);
    // Handle specific error types
    if (response.error.includes('not found')) {
      // Handle entity not found
    } else if (response.error.includes('unavailable')) {
      // Handle service unavailable
    }
  }
}

// Usage
socket.on('clarity.model/get', (response) => {
  handleClarityResponse(response, (data) => {
    console.log('Retrieved model:', data);
  });
});
```

## Performance Considerations

- **Batch Operations**: Use `get-batch` for multiple entities to reduce round trips
- **Selective Retrieval**: Use specific Quintessential Model endpoints when you only need category-specific data
- **Fact Filtering**: The `facts` array in responses can be large; consider client-side filtering for UI display
- **Connection Management**: Reuse WebSocket connections for multiple operations
- **Error Recovery**: Implement reconnection logic for production applications

## Integration with Other Services

Clarity WebSocket API integrates seamlessly with:

- **Portal**: Routes WebSocket connections through the API gateway
- **Knowledge Integrator**: Frontend applications consume semantic models
- **Archivist**: Backend data source for all semantic operations
- **NOUS**: Future AI-powered semantic reasoning integration

---

This WebSocket API provides the foundation for all semantic model operations in the Relica ecosystem, enabling real-time interaction with the Quintessential Model and semantic relationships.