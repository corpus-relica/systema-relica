# 🧠 Basis Namespace Guide

The Basis namespace provides advanced graph traversal and semantic operations for the Archivist service. It is a direct port from the Clojure reference implementation, representing the core "concretization of thought" for graph-based knowledge representation.

## 🎯 Overview

The Basis namespace consists of four primary services that work together to provide comprehensive graph traversal capabilities:

- **BasisCoreService**: Core graph operations and type expansion
- **BasisConeService**: Descendant hierarchy operations  
- **BasisLineageService**: Ancestor inheritance chains
- **BasisRelationService**: Role-based relation semantics

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Basis Namespace                         │
├─────────────────────────────────────────────────────────────┤
│  BasisCoreService                                           │
│  ├── getRelations()           ├── expandTypes()             │
│  ├── getRelationsRecursive()  └── factSetOperation()        │
│  └── Cycle Detection & Deduplication                       │
├─────────────────────────────────────────────────────────────┤
│  BasisConeService (Descendants)                            │
│  ├── getSubtypes()            ├── calculateCone()           │
│  ├── getSubtypesRecursive()   └── getCone()                 │
│  └── Hierarchy Navigation                                   │
├─────────────────────────────────────────────────────────────┤
│  BasisLineageService (Ancestors)                           │
│  ├── getSupertypes()          ├── calculateLineage()        │
│  ├── getSupertypesRecursive() ├── getLineage()              │
│  └── findCommonAncestor()     └── Inheritance Chains       │
├─────────────────────────────────────────────────────────────┤
│  BasisRelationService (Semantics)                          │
│  ├── Role Constraints         ├── Semantic Validation       │
│  ├── Relationship Rules       └── Context Awareness        │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 BasisCoreService

The core service provides fundamental graph traversal operations with advanced direction control and type expansion.

### Core Operations

#### `getRelations(uid, options)`

Get direct relations for an entity with comprehensive filtering options.

```typescript
interface RelationOptions {
  direction?: 'outgoing' | 'incoming' | 'both';
  edgeType?: number | number[];
  includeSubtypes?: boolean;
}

// Example: Get all outgoing specialization relations
const relations = await basisCore.getRelations(123456, {
  direction: 'outgoing',
  edgeType: 1146, // specialization relation
  includeSubtypes: true
});
```

**Parameters:**
- `uid`: Entity UID to traverse from
- `options.direction`: Direction of traversal
  - `'outgoing'`: Entity → Relation → Target
  - `'incoming'`: Source → Relation → Entity  
  - `'both'`: Bidirectional traversal
- `options.edgeType`: Filter by relation type UID(s)
- `options.includeSubtypes`: Include subtypes of the edge type

**Returns:** Array of fact objects representing the relations

#### `getRelationsRecursive(uid, options)`

Recursive relation traversal with cycle detection and depth limiting.

```typescript
interface RecursiveOptions extends RelationOptions {
  maxDepth?: number;
}

// Example: Get specialization hierarchy up to 5 levels deep
const hierarchy = await basisCore.getRelationsRecursive(123456, {
  direction: 'outgoing',
  edgeType: 1146,
  maxDepth: 5
});
```

**Features:**
- **Cycle Detection**: Prevents infinite loops in circular hierarchies
- **Depth Limiting**: Configurable maximum traversal depth
- **Deduplication**: Automatic removal of duplicate facts
- **Performance Optimization**: Visited node tracking

#### `expandTypes(edgeTypes)`

Expand type collections to include all subtypes using cached descendant information.

```typescript
// Expand single type
const expanded = await basisCore.expandTypes(1146);
// Returns: [1146, 1981, 5937, ...] // All subtypes of 1146

// Expand multiple types
const expandedMultiple = await basisCore.expandTypes([1146, 1225]);
```

**Use Cases:**
- Query optimization by including all relevant subtypes
- Semantic search expansion
- Type hierarchy navigation

#### `factSetOperation(ops, factColls, keys)`

Perform set operations on collections of facts.

```typescript
const facts1 = [/* fact collection 1 */];
const facts2 = [/* fact collection 2 */];

// Union operation
const union = basisCore.factSetOp('union', [facts1, facts2], 'fact_uid');

// Intersection
const intersection = basisCore.factSetOp('intersection', [facts1, facts2], 'fact_uid');

// Difference
const difference = basisCore.factSetOp('difference', [facts1, facts2], 'fact_uid');

// Complex sequence
const result = basisCore.factSetOp(
  ['union', 'intersection'],
  [facts1, facts2, facts3],
  ['fact_uid', 'lh_object_uid']
);
```

### Internal Implementation Details

#### Query Patterns

The service uses optimized Cypher patterns that match the Clojure implementation:

```typescript
// Direct relations pattern
const query = `
  MATCH (start:Entity)--(r)-->(end:Entity)
  WHERE start.uid = $start_uid
  RETURN r
`;

// Reverse relations pattern  
const reverseQuery = `
  MATCH (start:Entity)<--(r)--(end:Entity)
  WHERE start.uid = $start_uid
  RETURN r
`;
```

#### Cycle Detection Algorithm

```typescript
private async traverse(currentUid: number, currentDepth: number): Promise<void> {
  if (currentDepth >= maxDepth || visited.has(currentUid)) {
    return; // Cycle detected or depth limit reached
  }
  
  visited.add(currentUid);
  const relations = await getRelated(currentUid);
  // ... continue traversal
}
```

## 🌲 BasisConeService

Manages descendant hierarchies and cone operations (all entities below a given node in the hierarchy).

### Cone Operations

#### `getSubtypes(uid)`

Get direct subtype concepts of an entity.

```typescript
// Get direct subtypes of "Vehicle"
const subtypes = await basisCone.getSubtypes(123456);
// Returns: Facts where relation type is 1146 (specialization) and rh_object_uid is 123456
```

#### `getSubtypesRecursive(uid, maxDepth)`

Get subtype hierarchy to a specified depth.

```typescript
// Get all subtypes up to 3 levels deep
const deepSubtypes = await basisCone.getSubtypesRecursive(123456, 3);
```

#### `calculateCone(uid)`

Compute all descendants from an input node.

```typescript
// Calculate complete descendant cone
const descendants = await basisCone.calculateCone(123456);
// Returns: Array of UIDs representing all descendant concepts
```

**Algorithm:**
1. Get all recursive subtype relations
2. Extract unique LH object UIDs (the subtypes)
3. Return deduplicated UID set

#### `getCone(uid)`

Get cached descendant set for performance optimization.

```typescript
// Use cached descendants if available
const cachedDescendants = await basisCone.getCone(123456);
```

### Cone Use Cases

- **Type Inference**: Determine all possible subtypes for classification
- **Search Expansion**: Include all subtypes in search queries
- **Hierarchy Visualization**: Build tree structures for UI display
- **Constraint Validation**: Check type compatibility

## 🧬 BasisLineageService

Manages ancestor relationships and inheritance chains.

### Lineage Operations

#### `getSupertypes(uid)`

Get direct supertype concepts of an entity.

```typescript
// Get immediate parents in hierarchy
const supertypes = await basisLineage.getSupertypes(123456);
```

#### `getSupertypesRecursive(uid, maxDepth)`

Get supertype hierarchy to a specified depth.

```typescript
// Get ancestor chain up to root
const ancestors = await basisLineage.getSupertypesRecursive(123456, 10);
```

#### `calculateLineage(uid)`

Calculate complete paths from node to root.

```typescript
// Get full inheritance chain
const lineage = await basisLineage.calculateLineage(123456);
// Returns: [123456, 789012, 456789, 730000] // Path to root
```

**Algorithm:**
1. Traverse supertype relations recursively
2. Build paths to root concept (UID 730000)
3. Return ordered UID sequence

#### `getLineage(uid)`

Get ordered list of ancestors (cached version).

```typescript
const ancestorPath = await basisLineage.getLineage(123456);
```

#### `findCommonAncestor(uid1, uid2)`

Find the closest common ancestor between two entities.

```typescript
const commonAncestor = await basisLineage.findCommonAncestor(123456, 789012);
// Returns: UID of the nearest shared ancestor, or null if none exists
```

**Algorithm:**
1. Calculate lineage for both entities
2. Find intersection of lineage paths
3. Return first (closest) common ancestor

### Lineage Use Cases

- **Type Compatibility**: Check if two types share common ancestors
- **Inheritance Resolution**: Determine property inheritance paths
- **Classification Validation**: Verify type hierarchy consistency
- **Semantic Similarity**: Measure conceptual distance between entities

## 🔗 BasisRelationService

Handles role-based relation semantics and advanced relationship constraints.

### Relation Operations

The relation service provides sophisticated semantic validation and constraint checking for relationships based on Gellish role semantics.

#### Role-Based Semantics

```typescript
// Example: Validate that an entity can play a specific role
const canPlay = await basisRelation.validateRole(entityUid, roleUid);

// Check relationship constraints
const isValidRelation = await basisRelation.validateRelation({
  lh_object_uid: 123456,
  rel_type_uid: 1146,
  rh_object_uid: 789012
});
```

#### Constraint Types

1. **Type Constraints**: Ensure LH and RH objects are compatible types
2. **Role Constraints**: Validate that entities can play required roles
3. **Cardinality Constraints**: Check relationship multiplicity rules
4. **Context Constraints**: Verify relationship validity in specific contexts

### Advanced Features

#### Context-Aware Validation

```typescript
interface ValidationContext {
  domain?: string;
  language?: number;
  validityContext?: number;
  temporalContext?: DateRange;
}

const isValid = await basisRelation.validateInContext(fact, context);
```

#### Semantic Rules Engine

The relation service implements a rules engine for complex semantic validation:

```typescript
// Example rule: "A vehicle cannot be classified as a building"
const rule = {
  condition: (fact) => fact.rel_type_uid === 1225, // classification
  constraint: (fact) => !isConflictingTypes(fact.lh_object_uid, fact.rh_object_uid)
};
```

## 🚀 Performance Optimizations

### Caching Strategy

The Basis namespace leverages multiple caching layers:

```typescript
// 1. Redis-backed descendant cache
const descendants = await cacheService.allDescendantsOf(uid);

// 2. Lineage cache
const lineage = await cacheService.getEntityLineageCache(uid);

// 3. In-memory visited nodes (cycle detection)
const visited = new Set<number>();
```

### Query Optimization

#### Indexed Cypher Queries

```cypher
// Optimized with compound indexes
MATCH (start:Entity)--(r)-->(end:Entity)
WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
RETURN r
```

#### Batch Operations

```typescript
// Process multiple UIDs in single query
const results = await Promise.all(
  uids.map(uid => basisCore.getRelations(uid, options))
);
```

### Memory Management

- **Lazy Loading**: Only load required relations
- **Garbage Collection**: Clean up visited sets after traversal
- **Connection Pooling**: Reuse database connections
- **Result Streaming**: Process large result sets incrementally

## 🧪 Testing the Basis Namespace

### Unit Testing

```typescript
import { BasisCoreService } from './core.service';

describe('BasisCoreService', () => {
  it('should get direct relations', async () => {
    const relations = await basisCore.getRelations(123456, {
      direction: 'outgoing',
      edgeType: 1146
    });
    
    expect(relations).toBeDefined();
    expect(relations.length).toBeGreaterThan(0);
  });
  
  it('should detect cycles in recursive traversal', async () => {
    // Test with circular hierarchy
    const relations = await basisCore.getRelationsRecursive(123456, {
      maxDepth: 10
    });
    
    // Should not infinite loop
    expect(relations).toBeDefined();
  });
});
```

### Integration Testing

```typescript
describe('Basis Namespace Integration', () => {
  it('should coordinate cone and lineage operations', async () => {
    const uid = 123456;
    
    // Get descendants
    const descendants = await basisCone.calculateCone(uid);
    
    // Get ancestors  
    const ancestors = await basisLineage.calculateLineage(uid);
    
    // Validate relationship
    const isValid = await basisRelation.validateRelation({
      lh_object_uid: descendants[0],
      rel_type_uid: 1146,
      rh_object_uid: ancestors[0]
    });
    
    expect(isValid).toBeTruthy();
  });
});
```

### Performance Testing

```typescript
describe('Basis Performance', () => {
  it('should handle large hierarchies efficiently', async () => {
    const startTime = Date.now();
    
    const result = await basisCore.getRelationsRecursive(730000, {
      maxDepth: 5
    });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });
});
```

## 🔍 Debugging and Troubleshooting

### Enable Debug Logging

```typescript
// In development environment
const basisCore = new BasisCoreService(graphService, cacheService);
basisCore.logger.setLevel('debug');
```

### Common Issues

#### 1. Cycle Detection False Positives

```typescript
// If getting unexpected cycle detection, check for:
// - Incorrect UID comparisons
// - Set implementation issues
// - Depth calculation errors
```

#### 2. Performance Degradation

```typescript
// Check for:
// - Missing cache hits
// - Inefficient query patterns  
// - Large result sets without pagination
```

#### 3. Type Expansion Issues

```typescript
// Verify:
// - Cache service connectivity
// - Descendant cache consistency
// - Subtype relationship integrity
```

### Monitoring

```typescript
// Add performance monitoring
const timer = performance.now();
const result = await basisCore.getRelations(uid, options);
const duration = performance.now() - timer;

logger.verbose(`getRelations took ${duration}ms for UID ${uid}`);
```

## 📊 Usage Examples

### Complete Hierarchy Analysis

```typescript
async function analyzeHierarchy(uid: number) {
  // Get complete picture of an entity's position in hierarchy
  const ancestors = await basisLineage.calculateLineage(uid);
  const descendants = await basisCone.calculateCone(uid);
  const directRelations = await basisCore.getRelations(uid, {
    direction: 'both'
  });
  
  return {
    uid,
    ancestors,
    descendants,
    directRelations,
    hierarchyDepth: ancestors.length,
    branchingFactor: descendants.length
  };
}
```

### Semantic Search Enhancement

```typescript
async function enhancedSearch(query: string, conceptUID: number) {
  // Expand search to include all related concepts
  const relatedTypes = await basisCore.expandTypes([conceptUID]);
  const searchResults = await searchService.getTextSearch(
    query,
    relatedTypes,
    1,
    20
  );
  
  return searchResults;
}
```

### Type Compatibility Check

```typescript
async function areTypesCompatible(type1: number, type2: number) {
  const commonAncestor = await basisLineage.findCommonAncestor(type1, type2);
  return commonAncestor !== null;
}
```

## 🔗 Integration with Other Services

### GraphService Integration

```typescript
// The Basis namespace relies on GraphService for all Neo4j operations
const graphService = new GraphService(neo4jService);
const basisCore = new BasisCoreService(graphService, cacheService);
```

### CacheService Integration

```typescript
// Leverages Redis caching for performance
const cacheService = new CacheService(redisClient, linearizationService);
```

### WebSocket Handler Integration

```typescript
// Basis operations are exposed through WebSocket handlers
socket.emit('basis:cone:calculate', { uid: 123456 });
socket.on('basis:cone:result', (descendants) => {
  console.log('Descendants:', descendants);
});
```

---

**The Basis namespace represents the core intelligence of the Archivist service, providing the semantic foundation for all graph-based operations and knowledge representation.**