# Concept Placement Tools Implementation Plan

## Overview
Implementation of AI-driven concept placement tools using LangChain's LCEL and structured output patterns.

## Architecture Overview
Using LangChain's recommended `.with_structured_output()` approach with LCEL chains for constrained generation.

## Tool 1: `categorizeConceptType`

### Pydantic Schema:
```python
class ConceptCategory(BaseModel):
    """Semantic category classification for a concept."""
    category: Literal["physical object", "aspect", "role", "relation", "state", "occurrence", "other"]
    reasoning: str = Field(description="Brief explanation for the classification")
```

### LCEL Chain:
```python
categorization_prompt = ChatPromptTemplate.from_template("""
Analyze this concept and determine its fundamental semantic category:

Term: {term}
Definition: {definition}

Categories:
- physical object: tangible things that exist in space
- aspect: properties or characteristics of things  
- role: functions played by entities in relations
- relation: connections between entities
- state: conditions or situations
- occurrence: events or processes
- other: doesn't fit above categories

Respond with the most appropriate category and reasoning.
""")

categorize_chain = categorization_prompt | llm.with_structured_output(ConceptCategory)
```

## Tool 2: `findOptimalPlacement`

### Function 1: `_get_subtypes_with_definitions(uid)`
- Uses existing `loadDirectSubtypes()` and `getEntityDefinition()`
- Returns structured data: `List[Tuple[int, str, str]]`

### Function 2: `_select_best_subtype()`

#### Pydantic Schema:
```python
class SubtypeSelection(BaseModel):
    """Selection of best subtype for concept placement."""
    selected_uid: Optional[int] = Field(description="UID of best subtype, or None if none suitable")
    reasoning: str = Field(description="Explanation for the selection")
```

#### LCEL Chain:
```python
selection_prompt = ChatPromptTemplate.from_template("""
Target concept: {term} - {definition}

Available subtypes:
{subtypes_context}

Which subtype UID would be the most appropriate immediate supertype for the target concept?
Return the UID, or None if no subtype is suitable (meaning the target should be placed at current level).
""")

selection_chain = selection_prompt | llm.with_structured_output(SubtypeSelection)
```

### Function 3: `_find_best_placement_recursive()`
- Orchestrates the recursive descent
- Uses Function 1 & 2 in loop until no suitable subtypes found

## Key LCEL Patterns Used:
1. **Structured Output**: `llm.with_structured_output(Schema)` for constrained generation
2. **Chain Composition**: `prompt | llm.with_structured_output(Schema)`  
3. **Literal Types**: Enforces exact category values
4. **Optional Fields**: Handles "None" selection cleanly

## Implementation Benefits:
- ✅ **Type Safety**: Pydantic models ensure valid outputs
- ✅ **Constrained Generation**: No parsing errors from malformed responses  
- ✅ **LCEL Integration**: Clean, composable chains
- ✅ **Debugging**: Structured reasoning fields for transparency
- ✅ **Modern Patterns**: Uses LangChain's recommended approaches

## File Changes:
- **Add**: Two new tools in `src/agent/tools.py`
- **Add**: Category root mapping in `src/config.py`  
- **Add**: Pydantic models for structured output
- **Update**: Tool registration in `create_agent_tools()`

---

## Implementation Progress

### ✅ Completed Tasks
- [x] Plan committed to scratchpad
- [x] Add category root mapping to config.py
- [x] Add Pydantic models for structured output to tools.py
- [x] Implement categorizeConceptType tool with LCEL chain
- [x] Implement _get_subtypes_with_definitions helper function
- [x] Implement _select_best_subtype with structured output
- [x] Implement _find_best_placement_recursive function
- [x] Implement findOptimalPlacement tool
- [x] Update tool registration in create_agent_tools

### 🚧 In Progress Tasks
- [ ] Test the new tools

### 📋 Todo Tasks
- [ ] Document usage examples
- [ ] Refine response parsing based on actual tool outputs

---

## Notes & Discoveries

### Category Root UIDs (need to verify actual values)
```python
CATEGORY_ROOTS = {
    'physical object': 490159,  # placeholder - verify actual UID
    'aspect': 790229,          # placeholder - verify actual UID  
    'role': 160170,            # placeholder - verify actual UID
    'relation': 1146,          # placeholder - verify actual UID
    'state': 4290,             # placeholder - verify actual UID
    'occurrence': 5210,        # placeholder - verify actual UID
    'other': 730000           # fallback to 'anything' - verify actual UID
}
```

### Implementation Strategy
1. Start with config changes for category roots
2. Add Pydantic models to tools.py
3. Implement categorization tool first (simpler)
4. Then implement placement tool with helper functions
5. Test incrementally

### Questions/Issues to Resolve
- [ ] Verify actual UID values for category roots
- [ ] Confirm LLM model supports structured output
- [ ] Test performance with recursive descent

---

## Scratchpad

### Implementation Complete! 🎉

All core functionality has been implemented:

1. **categorizeConceptType** tool using LCEL with structured output
2. **findOptimalPlacement** tool with recursive descent algorithm  
3. Helper functions using existing tool infrastructure
4. Proper error handling and fallbacks
5. Clean integration with existing tool system

### Key Implementation Details:

- **LLM Configuration**: Using ChatGroq with low temperature (0.1) for consistent classification
- **Structured Output**: Pydantic models ensure type safety and prevent parsing errors
- **LCEL Patterns**: Modern LangChain patterns with `|` operator and `.with_structured_output()`
- **Error Handling**: Comprehensive try/catch blocks with meaningful error messages
- **Response Parsing**: Basic parsing logic for existing tool outputs (may need refinement)

### Usage Examples:
```python
# Step 1: Categorize a concept
result1 = await categorizeConceptType("bicycle", "two-wheeled vehicle for transportation")
# Returns: "Category: physical object\nReasoning: A bicycle is a tangible..."

# Step 2: Find optimal placement  
result2 = await findOptimalPlacement("bicycle", "two-wheeled vehicle for transportation", "physical object")
# Returns: "Optimal placement for 'bicycle':\nUID: 12345\nSupertype: vehicle\nCategory: physical object"
```

### Next Steps:
1. Test with actual NOUS service
2. Refine response parsing based on real tool outputs
3. Verify category root UIDs are correct
4. Add more sophisticated error recovery