# AI-Oriented Documentation Format (AODF) Specification v1.0

## Purpose
This specification defines a structured documentation format optimized for AI agents to understand, navigate, and troubleshoot complex codebases. It prioritizes machine-parseability while maintaining human readability.

## Format Structure

### Document Header
Every AODF document begins with a header in the format:
```
# AODF/{version} - COMPONENT: {component_name}
```

### Section Format
Each section follows this pattern:
```
## {SECTION_NAME}
- {KEY}: {value}
- {KEY}: [{list_item1}, {list_item2}]
- {KEY}: {
    {subkey}: {value},
    {subkey}: {value}
  }
```

### Data Types
- **Simple value**: `KEY: value`
- **String with spaces**: `KEY: "quoted string value"`
- **Array/List**: `KEY: [item1, item2, item3]`
- **Object/Map**: `KEY: {key1: value1, key2: value2}`
- **Complex object in list**: `KEY: [{key1: value1}, {key1: value2}]`

### Required Sections
1. **META**: Information about the document itself
2. **IDENTITY**: Basic identification of the component
3. **FUNCTION**: The component's purpose and role
4. **STRUCTURE**: Code organization and key files
5. **RELATIONSHIPS**: How this component interacts with others

### Optional Sections
6. **EXECUTION_FLOW**: Sequence of operations
7. **OPERATIONS**: Key functionalities
8. **CLIENT_USAGE**: How other components use this one
9. **TROUBLESHOOTING**: Common issues and where to look
10. **DEPLOYMENT**: How the component is deployed
11. **CONCEPTUAL_MODEL**: Abstract understanding of the component

## File Paths
- Always use forward slashes
- Paths should be relative to the component root unless referencing other components
- When referencing other components, use full paths from repository root

## Relationship Representation
- Always specify both components in a relationship
- Include the interface or mechanism of interaction
- Specify the direction of data or control flow

## Versioning
The AODF version appears in the document header and META section. This allows the format to evolve while maintaining backward compatibility.

## Best Practices
1. Be explicit about file paths and function names
2. Use consistent terminology across documents
3. Prioritize structural information over prose descriptions
4. Include enough context for an AI to form a mental model
5. Focus on navigation and troubleshooting paths
6. Maintain a balance between comprehensiveness and conciseness
