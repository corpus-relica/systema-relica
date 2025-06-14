# Semantic Operations Guide

This guide covers the core semantic operations provided by Clarity for managing and querying the Quintessential Model and semantic relationships.

## Overview

Clarity provides sophisticated semantic operations that leverage the Quintessential Model to enable:

- Entity model retrieval with inheritance patterns
- Semantic relationship traversal and analysis
- Batch operations for efficient data access
- Definition and collection management
- Fact pattern querying and manipulation

## Core Operation Types

### Model Retrieval Operations

Model retrieval forms the foundation of semantic operations, providing structured access to entities with their complete semantic context.

#### Single Model Retrieval

**Basic Model Retrieval**
```typescript
// Get any entity model
const response = await clarityClient.getModel(123456);

// Response structure varies by entity type and nature
{
  uid: 123456,
  name: "Automobile",
  type: "kind",
  category: "physical object",
  // Category-specific attributes
  aspects: [...],
  roles: [...],
  // Semantic relationships
  1146: [654321], // specialization-of
  1225: [789012], // classification
}
```

**Nature-Specific Retrieval**
```typescript
// Get kind model with type-specific operations
const kindModel = await clarityClient.getKindModel(123456);

// Get individual model with instance-specific data
const individualModel = await clarityClient.getIndividualModel(789012);
```

#### Batch Model Retrieval

Efficient retrieval of multiple entities in a single operation:

```typescript
// Retrieve multiple models simultaneously
const models = await clarityClient.getBatchModels([
  730044, // Physical Object
  790229, // Aspect  
  160170, // Role
  2850,   // Relation
  193671  // Occurrence
]);

// Process each model by category
models.forEach(model => {
  switch(model.category) {
    case 'physical object':
      processPhysicalObject(model);
      break;
    case 'aspect':
      processAspect(model);
      break;
    // ... handle other categories
  }
});
```

### Quintessential Model Operations

Category-specific operations that return models enhanced with type-specific semantic information.

#### Physical Object Operations

```typescript
// Get physical object with all semantic relationships
const physicalObject = await clarityClient.getPhysicalObjectModel(730044);

// Extract semantic information
const {
  aspects,      // Properties this object can have
  roles,        // Roles this object can play
  components,   // Parts this object contains
  connections   // Spatial/functional connections
} = physicalObject;

// Example: Build composition hierarchy
function buildCompositionTree(objectModel) {
  return {
    entity: objectModel,
    parts: objectModel.components.map(component => 
      clarityClient.getPhysicalObjectModel(component.uid)
    )
  };
}
```

#### Aspect Operations

```typescript
// Get aspect with possessor relationships
const aspectModel = await clarityClient.getAspectModel(790229);

// Determine aspect characteristics
const {
  possessors,      // Entities that can have this aspect
  isQuantitative,  // Whether aspect has measurable values
  unitOfMeasure    // Unit for quantitative aspects
} = aspectModel;

// Example: Validate aspect assignment
function canHaveAspect(entityUID, aspectUID) {
  const aspect = await clarityClient.getAspectModel(aspectUID);
  const entity = await clarityClient.getModel(entityUID);
  
  return aspect.possessors.some(possessor => 
    isSpecializationOf(entity.uid, possessor.uid)
  );
}
```

#### Role Operations

```typescript
// Get role with player and relation information
const roleModel = await clarityClient.getRoleModel(160170);

const {
  rolePlayers,         // Entities that can play this role
  requiredInRelations  // Relations requiring this role
} = roleModel;

// Example: Find applicable relations for entity
function findApplicableRelations(entityUID, roleUID) {
  const role = await clarityClient.getRoleModel(roleUID);
  
  // Check if entity can play the role
  const canPlay = role.rolePlayers.some(player => 
    isClassifiedBy(entityUID, player.uid)
  );
  
  if (canPlay) {
    return role.requiredInRelations;
  }
  return [];
}
```

#### Relation Operations

```typescript
// Get relation with role requirements
const relationModel = await clarityClient.getRelationModel(2850);

const {
  requiredRole1,    // First role requirement
  requiredRole2,    // Second role requirement  
  inverseRelation   // Opposite direction relation
} = relationModel;

// Example: Validate relation instance
function validateRelationInstance(lhEntity, rhEntity, relationUID) {
  const relation = await clarityClient.getRelationModel(relationUID);
  
  const lhCanPlay = canPlayRole(lhEntity, relation.requiredRole1.uid);
  const rhCanPlay = canPlayRole(rhEntity, relation.requiredRole2.uid);
  
  return lhCanPlay && rhCanPlay;
}
```

#### Occurrence Operations

```typescript
// Get occurrence with temporal and involvement information
const occurrenceModel = await clarityClient.getOccurrenceModel(193671);

const {
  aspects,          // Properties of the occurrence
  involved,         // Entities involved in the occurrence
  temporalAspects   // Temporal information
} = occurrenceModel;

// Example: Timeline analysis
function analyzeTimeline(occurrenceUID) {
  const occurrence = await clarityClient.getOccurrenceModel(occurrenceUID);
  const { beginTime, endTime, duration } = occurrence.temporalAspects;
  
  return {
    start: beginTime?.value,
    end: endTime?.value,
    duration: duration?.value,
    participants: occurrence.involved
  };
}
```

### Semantic Relationship Analysis

Advanced operations for analyzing and traversing semantic relationships.

#### Specialization Hierarchy Operations

```typescript
// Get complete specialization hierarchy
async function getSpecializationHierarchy(uid) {
  const model = await clarityClient.getModel(uid);
  const supertypes = model[1146] || []; // specialization-of relationships
  
  const hierarchy = {
    entity: model,
    supertypes: await Promise.all(
      supertypes.map(supertypeUID => 
        getSpecializationHierarchy(supertypeUID)
      )
    )
  };
  
  return hierarchy;
}

// Check if entity specializes another
function isSpecializationOf(entityUID, supertypeUID) {
  // Traverse hierarchy to check specialization
  const hierarchy = getSpecializationHierarchy(entityUID);
  return findInHierarchy(hierarchy, supertypeUID);
}
```

#### Classification Analysis

```typescript
// Get classification relationships for individuals
async function getClassifications(individualUID) {
  const individual = await clarityClient.getIndividualModel(individualUID);
  const classifiers = individual[1225] || []; // classification relationships
  
  return Promise.all(
    classifiers.map(classifierUID => 
      clarityClient.getKindModel(classifierUID)
    )
  );
}

// Check multiple classification
function isMultipleClassified(individualUID) {
  const classifications = getClassifications(individualUID);
  return classifications.length > 1;
}
```

#### Semantic Path Finding

```typescript
// Find semantic path between entities
async function findSemanticPath(fromUID, toUID, maxDepth = 5) {
  const visited = new Set();
  const queue = [{ uid: fromUID, path: [fromUID], depth: 0 }];
  
  while (queue.length > 0) {
    const { uid, path, depth } = queue.shift();
    
    if (uid === toUID) {
      return path;
    }
    
    if (depth >= maxDepth || visited.has(uid)) {
      continue;
    }
    
    visited.add(uid);
    const model = await clarityClient.getModel(uid);
    
    // Explore all semantic relationships
    for (const [relationUID, targetUIDs] of Object.entries(model)) {
      if (typeof targetUIDs === 'object' && Array.isArray(targetUIDs)) {
        for (const targetUID of targetUIDs) {
          queue.push({
            uid: targetUID,
            path: [...path, targetUID],
            depth: depth + 1
          });
        }
      }
    }
  }
  
  return null; // No path found
}
```

### Definition and Collection Management

Operations for managing entity definitions and organizational collections.

#### Definition Operations

```typescript
// Update entity definition
async function updateDefinition(uid, partialDef, fullDef) {
  return await clarityClient.updateDefinition({
    uid,
    partial_definition: partialDef,
    full_definition: fullDef
  });
}

// Generate AI-powered definition
async function generateDefinition(uid) {
  // Get specialization hierarchy for context
  const hierarchy = await getSpecializationHierarchy(uid);
  const model = await clarityClient.getModel(uid);
  
  // Use AI service to generate definition based on semantic context
  return await aiService.generateDefinition({
    entity: model,
    hierarchy: hierarchy,
    category: model.category
  });
}
```

#### Collection Management

```typescript
// Update entity collection assignment
async function updateCollection(factUID, collectionUID, collectionName) {
  return await clarityClient.updateCollection({
    fact_uid: factUID,
    collection_uid: collectionUID,
    collection_name: collectionName
  });
}

// Organize entities by semantic similarity
async function organizeBySemanticSimilarity(entityUIDs) {
  const models = await clarityClient.getBatchModels(entityUIDs);
  
  // Group by category and specialization
  const groups = models.reduce((acc, model) => {
    const key = `${model.category}-${model[1146]?.[0] || 'root'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(model);
    return acc;
  }, {});
  
  return groups;
}
```

### Fact Pattern Operations

Advanced querying and manipulation of fact patterns.

#### Fact Retrieval and Analysis

```typescript
// Get all facts for entity with semantic analysis
async function getEntityFactsWithAnalysis(uid) {
  const facts = await clarityClient.getFactsByEntity(uid);
  
  // Categorize facts by semantic relationship type
  const categorizedFacts = facts.reduce((acc, fact) => {
    const semantic = RELATION_UID_TO_SEMANTIC[fact.rel_type_uid];
    if (!acc[semantic]) acc[semantic] = [];
    acc[semantic].push(fact);
    return acc;
  }, {});
  
  return {
    total: facts.length,
    categories: categorizedFacts,
    relationships: Object.keys(categorizedFacts)
  };
}

// Find fact patterns across entities
async function findFactPattern(pattern) {
  const { relationUID, entityCategory, factCount } = pattern;
  
  // Implementation would query for entities matching the pattern
  // This is a simplified example
  const entities = await findEntitiesByCategory(entityCategory);
  
  const matchingEntities = [];
  for (const entity of entities) {
    const facts = await clarityClient.getFactsByEntity(entity.uid);
    const relevantFacts = facts.filter(f => f.rel_type_uid === relationUID);
    
    if (relevantFacts.length >= factCount) {
      matchingEntities.push({
        entity,
        facts: relevantFacts
      });
    }
  }
  
  return matchingEntities;
}
```

### Complex Semantic Queries

Advanced operations combining multiple semantic concepts.

#### Relationship Network Analysis

```typescript
// Analyze relationship network around entity
async function analyzeRelationshipNetwork(centerUID, depth = 2) {
  const network = {
    center: centerUID,
    nodes: new Map(),
    edges: []
  };
  
  await buildNetworkRecursive(centerUID, depth, network);
  
  return {
    nodeCount: network.nodes.size,
    edgeCount: network.edges.length,
    categories: getCategoryDistribution(network.nodes),
    relationships: getRelationshipTypes(network.edges)
  };
}

async function buildNetworkRecursive(uid, remainingDepth, network) {
  if (remainingDepth <= 0 || network.nodes.has(uid)) {
    return;
  }
  
  const model = await clarityClient.getModel(uid);
  network.nodes.set(uid, model);
  
  // Add edges for all semantic relationships
  for (const [relationUID, targetUIDs] of Object.entries(model)) {
    if (Array.isArray(targetUIDs)) {
      for (const targetUID of targetUIDs) {
        network.edges.push({
          from: uid,
          to: targetUID,
          relation: relationUID,
          semantic: RELATION_UID_TO_SEMANTIC[relationUID]
        });
        
        await buildNetworkRecursive(targetUID, remainingDepth - 1, network);
      }
    }
  }
}
```

#### Semantic Validation

```typescript
// Validate semantic consistency
async function validateSemanticConsistency(uid) {
  const model = await clarityClient.getModel(uid);
  const validationResults = [];
  
  // Validate specialization hierarchy
  if (model[1146]) { // specialization-of
    for (const supertypeUID of model[1146]) {
      const supertype = await clarityClient.getModel(supertypeUID);
      if (supertype.category !== model.category) {
        validationResults.push({
          type: 'category_mismatch',
          message: `Entity ${uid} specializes ${supertypeUID} but categories differ`,
          severity: 'error'
        });
      }
    }
  }
  
  // Validate role-relation consistency
  if (model.category === 'role') {
    const roleModel = await clarityClient.getRoleModel(uid);
    for (const relation of roleModel.requiredInRelations) {
      const relationModel = await clarityClient.getRelationModel(relation.uid);
      const hasRole = (relationModel.requiredRole1?.uid === uid) || 
                      (relationModel.requiredRole2?.uid === uid);
      
      if (!hasRole) {
        validationResults.push({
          type: 'role_relation_mismatch',
          message: `Role ${uid} claims required by relation ${relation.uid} but relation doesn't require it`,
          severity: 'error'
        });
      }
    }
  }
  
  return validationResults;
}
```

## Performance Optimization

### Batch Processing Strategies

```typescript
// Efficient batch processing with chunking
async function processBatchWithChunking(uids, chunkSize = 10) {
  const results = [];
  
  for (let i = 0; i < uids.length; i += chunkSize) {
    const chunk = uids.slice(i, i + chunkSize);
    const chunkResults = await clarityClient.getBatchModels(chunk);
    results.push(...chunkResults);
    
    // Optional: Add delay to prevent overwhelming the service
    if (i + chunkSize < uids.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}
```

### Caching Strategies

```typescript
// Implement semantic-aware caching
class SemanticCache {
  private cache = new Map();
  private relationships = new Map();
  
  async getModel(uid) {
    if (this.cache.has(uid)) {
      return this.cache.get(uid);
    }
    
    const model = await clarityClient.getModel(uid);
    this.cache.set(uid, model);
    
    // Cache relationship mappings for fast lookups
    for (const [relationUID, targetUIDs] of Object.entries(model)) {
      if (Array.isArray(targetUIDs)) {
        this.addRelationshipMapping(uid, relationUID, targetUIDs);
      }
    }
    
    return model;
  }
  
  invalidateRelated(uid) {
    // Invalidate cache for semantically related entities
    const related = this.relationships.get(uid) || [];
    for (const relatedUID of related) {
      this.cache.delete(relatedUID);
    }
    this.cache.delete(uid);
  }
}
```

## Error Handling and Recovery

### Robust Operation Patterns

```typescript
// Implement retry logic for semantic operations
async function robustSemanticOperation(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}

// Usage
const model = await robustSemanticOperation(() => 
  clarityClient.getModel(123456)
);
```

These semantic operations provide the foundation for sophisticated knowledge management and reasoning capabilities in the Relica ecosystem, enabling applications to work with semantic relationships in an intuitive and powerful way.