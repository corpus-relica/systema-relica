"""
Concept placement helper functions for finding optimal ontological placement.

This module contains the core logic for:
1. Extracting and parsing subtype information
2. AI-powered subtype selection
3. Recursive ontology traversal
"""

import asyncio
from typing import Optional, List, Tuple, Literal
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

llm = ChatGroq(
    model="qwen-qwq-32b",
    temperature=0.1,
    top_p=0.95,
    max_retries=2,
    reasoning_format="parsed"
)

# Define the Pydantic model here to avoid circular imports
class SubtypeSelection(BaseModel):
    """Selection of best subtype for concept placement."""
    selected_uid: Optional[int] = Field(description="UID of best subtype, or None if none suitable")
    reasoning: str = Field(description="Explanation for the selection")

class ConceptCategory(BaseModel):
    """Semantic category classification for a concept."""
    category: Literal["physical object", "aspect", "role", "relation", "state", "occurrence", "other"]
    reasoning: str = Field(description="Brief explanation for the classification")

async def get_subtypes_with_definitions(uid: int, archivist_proxy) -> List[Tuple[int, str, str]]:
    """
    Get subtypes with their definitions from the ontology.
    
    Args:
        uid: The UID of the entity to get subtypes for
        archivist_proxy: The archivist proxy for making API calls
        
    Returns:
        List of (uid, name, definition) tuples for each subtype
    """
    try:
        print(f"Getting subtypes for UID: {uid}")
        
        # Get direct subtypes using the proxy
        subtypes_result = await archivist_proxy.get_subtypes(uid)
        print(f"Subtypes result: {subtypes_result}")
        
        if not subtypes_result or "error" in subtypes_result:
            print(f"No subtypes found or error: {subtypes_result}")
            return []
            
        # Extract facts from the result
        facts = subtypes_result # subtypes_result.get('facts', [])
        if not facts:
            print("No facts in subtypes result")
            return []
        
        subtypes = []
        processed_uids = set()  # Avoid duplicates
        
        for fact in facts:
            # Look for specialization relations where this entity is the right-hand (more general) side
            if (fact.get('rel_type_uid') == 1146 and  # specialization relation
                fact.get('rh_object_uid') == uid):      # this entity is the supertype
                
                subtype_uid = fact.get('lh_object_uid')  # The more specific entity
                subtype_name = fact.get('lh_object_name', f"Entity_{subtype_uid}")
                
                if subtype_uid and subtype_uid not in processed_uids:
                    processed_uids.add(subtype_uid)
                    
                    # Get definition for this subtype
                    # Note: We'll use a simplified definition for now since getEntityDefinition 
                    # might not be directly available on the proxy
                    definition = fact.get('partial_definition', 'No definition available')
                    if not definition or definition == '':
                        definition = fact.get('full_definition', 'No definition available')
                    
                    subtypes.append((subtype_uid, subtype_name, definition))
                    print(f"Found subtype: {subtype_uid} - {subtype_name}")
        
        return subtypes
        
    except Exception as e:
        print(f"Error getting subtypes for UID {uid}: {e}")
        return []


async def select_best_subtype(term: str, definition: str, subtypes: List[Tuple[int, str, str]]) -> Optional[int]:
    """
    Use LLM to select the best subtype for the given concept.
    
    Args:
        term: The concept term to place
        definition: Definition of the concept
        subtypes: List of (uid, name, definition) tuples for available subtypes
        llm: The language model to use for selection
        
    Returns:
        UID of the best subtype, or None if none are suitable
    """
    if not subtypes:
        return None
        
    try:
        # Format subtypes for the prompt
        subtypes_context = "\n".join([
            f"- UID {uid}: {name} - {desc}" 
            for uid, name, desc in subtypes
        ])
        
        selection_prompt = ChatPromptTemplate.from_template("""
Target concept: {term} - {definition}

Available subtypes:
{subtypes_context}

Which subtype UID would be the most appropriate taxonomic ancestor (immediate supertype or indirect) for the target concept?
Return the UID, or None if no subtype is suitable (meaning the target should be placed at current level).

Consider:
- Semantic similarity between target and subtype
- Logical hierarchical fit  
- Specificity level appropriate for the target concept
- Whether the subtype definition logically encompasses the target concept

Be conservative - only select a subtype if you're confident it's a good semantic fit.
""")

        selection_chain = selection_prompt | llm.with_structured_output(SubtypeSelection)
        result = await selection_chain.ainvoke({
            "term": term, 
            "definition": definition,
            "subtypes_context": subtypes_context
        })
        
        # Find the name associated with the selected_uid
        selected_name = next((name for uid, name, desc in subtypes if uid == result.selected_uid), None)
        print(f"LLM selection result: UID {result.selected_uid}, Name: {selected_name}, Reasoning: {result.reasoning}")

        return result.selected_uid
        
    except Exception as e:
        print(f"Error selecting best subtype: {e}")
        return None


async def find_best_placement_recursive(term: str, definition: str, current_uid: int, archivist_proxy, max_depth: int = 10) -> int:
    """
    Recursively find the best placement for a concept by traversing down the ontology.
    
    Args:
        term: The concept term to place
        definition: Definition of the concept  
        current_uid: Current position in the ontology
        aperture_proxy: The aperture proxy for making API calls
        llm: The language model to use for selection
        max_depth: Maximum recursion depth to prevent infinite loops
        
    Returns:
        UID of the most suitable supertype
    """
    if max_depth <= 0:
        print(f"Max depth reached, placing at current UID: {current_uid}")
        return current_uid
        
    try:
        print(f"Exploring placement at UID: {current_uid}, depth remaining: {max_depth}")
        
        # Get subtypes of current node
        subtypes = await get_subtypes_with_definitions(current_uid, archivist_proxy)
        
        if not subtypes:
            print(f"No subtypes available at UID {current_uid}, placing here")
            return current_uid
        
        print(f"Found {len(subtypes)} subtypes at UID {current_uid}")
        
        # Ask LLM to select best subtype
        selected_uid = await select_best_subtype(term, definition, subtypes)
        
        if selected_uid is None:
            print(f"No suitable subtype found at UID {current_uid}, placing here")
            return current_uid
        
        print(f"Selected subtype UID {selected_uid}, recursing deeper")
        # Recurse deeper with selected subtype
        return await find_best_placement_recursive(
            term, definition, selected_uid, archivist_proxy, max_depth - 1
        )
        
    except Exception as e:
        print(f"Error in recursive placement for UID {current_uid}: {e}")
        return current_uid


async def categorizeConceptType(term: str, definition: str = "") -> str:
    """
    Determines the fundamental semantic category of a concept.
    
    Args:
        term: The concept term to categorize
        definition: Optional brief definition of the concept
        
    Returns:
        JSON string with category and reasoning
    """
    try:
        categorization_prompt = ChatPromptTemplate.from_template("""
  Analyze this concept and determine its fundamental semantic category:

  Term: {term}
  Definition: {definition}

  Categories:
  - physical object: tangible things that exist in space (cars, buildings, people)
  - aspect: properties or characteristics of things (color, weight, temperature)
  - role: functions played by entities in relations (driver, owner, participant)
  - relation: connections between entities (contains, produces, manages)
  - state: conditions or situations (broken, active, completed)
  - occurrence: events or processes (meeting, explosion, growth)
  - other: doesn't fit the above categories

  Consider: Does this term primarily refer to what something IS, or what something DOES/how it functions?

  Respond with the most appropriate category and brief reasoning.

""")


        categorize_chain = categorization_prompt | llm.with_structured_output(ConceptCategory)
        result = await categorize_chain.ainvoke({"term": term, "definition": definition})
        
        return f"Category: {result.category}\nReasoning: {result.reasoning}"
        
    except Exception as e:
        return f"Error categorizing concept: {e}"


async def conjure_definition(
    supertype_uid: int,
    new_kind_name: str,
    archivist_proxy
) -> str:
    """
    Generate a definition for a new concept based on its specialization hierarchy.
    
    Args:
        supertype_uid: UID of the supertype
        new_kind_name: Name of the new concept to define
        archivist_proxy: The archivist proxy for getting specialization hierarchy
        
    Returns:
        Generated definition for the new concept
    """
    try:
        print('~~~~~~~~~~~~CONJURE DEFINITION~~~~~~~~~~~~')
        
        # Get specialization hierarchy
        # TODO: Uncomment when getSpecializationHierarchy is available
        # sh_result = await archivist_proxy.get_specialization_hierarchy(supertype_uid)
        # facts = sh_result.get('facts', [])
        
        # Temporary placeholder until hierarchy is available
        sh = {'facts': []}
        facts = sh['facts']
        
        # Build hierarchy string
        sh_str = '\n'.join([
            f"{f['lh_object_name']} : is a specialization of : {f['rh_object_name']} :: {f.get('partial_definition', '')}"
            for f in facts
        ])
        
        sys_prompt = f"""
You are an expert in ontology and concept hierarchies. You've been given a hierarchical structure of concepts, each defined in the format:

[Specific Concept] : is a specialization of : [General Concept] :: [Definition]

Your task is to generate a logical and consistent definition for a new concept that follows this pattern. The definition should:
1. Be consistent with the existing hierarchy
2. Add specific characteristics that distinguish it from its parent concept
3. Be concise but informative
4. Use similar language and style as the existing definitions

Here's the hierarchy for context:

{sh_str}

Now, complete the following new entry in the same style:

[New Concept] : is a specialization of : [Parent Concept] ::

Provide only the definition, starting after the double colon (::).
"""
        
        print(f'sysPrompt--->{sys_prompt}')
        
        # Get the parent name from the last fact in hierarchy
        parent_name = facts[-1]['lh_object_name'] if facts else "unknown"
        user_prompt = f"{new_kind_name} : is a specialization of : {parent_name} ::"
        
        print(f'userPrompt--->{user_prompt}')
        
        # Use the namespace llm instead of creating a new client
        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        # Invoke the llm directly
        result = await llm.ainvoke(messages)
        
        return result.content
        
    except Exception as e:
        print(f"Error conjuring definition: {e}")
        return f"Error generating definition: {e}"


async def infer_definition(term: str) -> str:
    """
    Infer a simple 1-2 sentence definition for a given term from the LLM's latent knowledge.
    
    Args:
        term: The term to define
        
    Returns:
        A concise definition inferred from the model's latent space
    """
    try:
        definition_prompt = ChatPromptTemplate.from_template("""
Define the following term in 1-2 clear, concise sentences:

Term: {term}

Provide only the definition, without prefacing with "Definition:" or the term itself.
""")
        
        # Create chain with direct text output
        definition_chain = definition_prompt | llm
        result = await definition_chain.ainvoke({"term": term})
        
        return result.content.strip()
        
    except Exception as e:
        print(f"Error inferring definition for '{term}': {e}")
        return f"Error inferring definition: {e}"


async def place_concept(term: str, archivist_proxy) -> dict:
    """
    Complete concept placement pipeline: infer definition, categorize, and find optimal placement.
    
    Args:
        term: The concept term to place in the taxonomy
        archivist_proxy: The archivist proxy for taxonomy traversal
        
    Returns:
        Dict containing the placement results with keys:
        - term: The input term
        - definition: The inferred definition
        - category: The semantic category
        - category_reasoning: Explanation for category selection
        - placement_uid: The optimal UID for placement
        - error: Error message if any step fails
    """
    try:
        print(f"\n{'='*50}")
        print(f"CONCEPT PLACEMENT PIPELINE FOR: {term}")
        print(f"{'='*50}\n")
        
        # Step 1: Infer definition
        print("Step 1: Inferring definition...")
        definition = await infer_definition(term)
        if definition.startswith("Error"):
            return {
                "term": term,
                "error": f"Failed to infer definition: {definition}"
            }
        print(f"Definition: {definition}\n")
        
        # Step 2: Categorize the concept
        print("Step 2: Categorizing concept...")
        category_result = await categorizeConceptType(term, definition)
        if category_result.startswith("Error"):
            return {
                "term": term,
                "definition": definition,
                "error": f"Failed to categorize: {category_result}"
            }
        
        # Parse category result
        lines = category_result.split('\n')
        category = lines[0].replace("Category: ", "").strip()
        reasoning = lines[1].replace("Reasoning: ", "").strip() if len(lines) > 1 else ""
        print(f"Category: {category}")
        print(f"Reasoning: {reasoning}\n")
        
        # Step 3: Get root UID for category
        print("Step 3: Finding category root...")
        from src.config import CATEGORY_ROOTS
        root_uid = CATEGORY_ROOTS.get(category)
        if root_uid is None:
            return {
                "term": term,
                "definition": definition,
                "category": category,
                "category_reasoning": reasoning,
                "error": f"Unknown category '{category}' - no root UID found"
            }
        print(f"Category root UID: {root_uid}\n")
        
        # Step 4: Find optimal placement
        print("Step 4: Finding optimal placement in taxonomy...")
        placement_uid = await find_best_placement_recursive(
            term, definition, root_uid, archivist_proxy
        )
        print(f"\nOptimal placement UID: {placement_uid}")
        
        print(f"\n{'='*50}")
        print(f"PLACEMENT COMPLETE")
        print(f"{'='*50}\n")
        
        return {
            "term": term,
            "definition": definition,
            "category": category,
            "category_reasoning": reasoning,
            "placement_uid": placement_uid,
            "root_uid": root_uid
        }
        
    except Exception as e:
        print(f"Error in concept placement pipeline: {e}")
        return {
            "term": term,
            "error": f"Pipeline error: {e}"
        }

