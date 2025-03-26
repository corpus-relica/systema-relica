#!/usr/bin/env python3

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from datetime import datetime
import uuid

from src.relica_nous_langchain.SemanticModel import semantic_model

from src.relica_nous_langchain.agent.Common import (
    anthropicModel,
    openAIModel,
    format_chat_history,
    ACTION_FINAL_ANSWER,
    ACTION_CONTINUE,
    )
from src.relica_nous_langchain.agent.Tools import (
    converted_tools,
    tool_descriptions,
    tool_names,
    tools,
    )

model = ChatAnthropic(
    model=anthropicModel,
    temperature=0.7,
    max_tokens=1500,
    timeout=None,
    max_retries=2,
).bind_tools(tools)

# model = ChatOpenAI(
#     model=openAIModel,
#     # temperature=0,
#     max_tokens=1500,
#     timeout=None,
#     max_retries=2,
#     ).bind_tools(tools)


background_info = '''
### Systema Relica Formal Model

Notional Entities: let NE be the set of all notional entities.
NE={ne1,ne2,...,nen}
Notional Relations: let NR be the set of all notional relations.
NR={nr1,nr2,...,nrn}
Notional Gellish Knowledge Model: let NG be the notional Gellish knowledge model, defined as the combination of NE and NR.
NG=(NE,NR)
Notional Kinds: let NK be the set of conceptual kinds.
NK={nk1,nk2,...,nkn} where NK⊂NE
Notional Individuals: let NI be the set of Individuals.
NI={ni1,ni2,...,nin} where NI⊂NE
Disjoint Notional Kinds and Individuals: NK and NI are disjoint subsets of NE.
NK∩NI=∅
Union of Notional Kinds and Individuals: NE is solely comprised of NK and NI.
NE=NK∪NI
Kinds of Notional Relations: Let KNR be the set of all notional relation kinds.
KNR={knr1,knr2,…,knrn} where KNR⊂NK
Existance of Specialization Relation: sr∊KNR
Existance of Classification Relation: cr∊KNR
Kinds of Notional Roles: Let KNΓ be the set of all notional role kinds.
KNΓ={knγ1,knγ2,…,knγn} where KNΓ⊂NK
Disjoint Notional Relations and Roles: KNR and KNΓ are disjoint subsets of NK.
KNR∩KNΓ=∅
Required Roles in Kinds of Notional Relations: A kind of notional relation r∊KNR can require one to n kinds of roles from KNΓ.
KNRreq={(r,γ1,γ2,…,γn)∣r∊KNR,γi∊KNΓ}
Role-playing Kinds: A kind k∊NK can play one or more roles from KNΓ.
NKplay={(k,γ1,γ2,…,γm)∣k∊NK,γi∊KNΓ}
Notional Individuals Classified as Notional Kinds: Every notional individual i∊NI is classified as some notional kind k∊NK.
NIclass={(i,k)|i∊NI,k∊NK}
Notional Relations Classified as Notional Relation Kinds: Every notional relation r∊NR is classified as some notional relation kind kr∊KNR.
NRclass={(r,kr)∣r∊NR,kr∊KNR}
Role Requirements in Classified Notional Relations: An classified notional relation r∊NR, which is classified as some kind kr∊KNR, will relate 1 to n notional individuals according to the roles required by kr.
NRreq={(r,i1,i2,…,in)∣r∊NR,ij∊NI,(r,kr)∊NRclass,(kr,γ1,γ2,…,γn)∊KNRreq}
Role Alignment in Classified Notional Relations: For a classified notional relation r, every notional individual ij related by r must play a role that aligns with the roles required by the kind kr of which r is classified.
NRalign={(r,ij,γj)∣(r,ij)∊NRreq,(γj,ij)∊NIclass,(γj)∊KNRreq}
Subtype-Supertype Pairs: We can define a set that contains all pairs of subtypes and supertypes connected by a specialization relation.
SubSupPairs={(k1,k2,sr)|k1,k2∊NK,sr∊SR}
Root of Specialization Hierarchy: Let Root represent the most general kind, 'Anything.'
Root={anything}where Root⊂NK
All Kinds are Subtypes of 'Anything': Every kind k in NK is either directly or indirectly a subtype of 'Anything,' connected by a specialization relation.
∀k∊NK,∃sr:(k,anything,sr)∊SubSupPairsor∃k′∊NK:(k,k′,sr)∊SubSupPairs&(k′,anything,sr)∊SubSupPairs.

### Systema Relica Semantic Model

Systema Relica is built on a foundational ontology defining five essential types that serve as cognitive primitives aligned with human conceptual understanding while supporting formal computational representation.

#### Core Types and Their Relationships

The semantic model is composed of five fundamental types that work together to represent knowledge:

**1. Physical Object**
- The foundation of the model - represents tangible entities in the world
- Can play roles in relations and occurrences
- Can possess aspects (properties)
- Can be composed of or a component of other physical objects (part-whole relationships)
- Can be connected to other physical objects

**2. Aspect**
- Represents properties that exist conceptually separate from but not independent of their possessor
- Two main types:
  - Quantitative aspects (numerical values, e.g., "12.3 kg")
  - Qualitative aspects (descriptive values, e.g., "red")
- Can have associated Units of Measurement (UoM)
- Can be possessed by physical objects or occurrences

**3. Role**
- Represents how entities participate in relations
- Can be played by physical objects
- Is required by relations (each relation needs defined roles)
- Examples: "driver", "component", "participant"

**4. Relation**
- Connects entities through their roles
- Requires at least two roles (role-1 and role-2)
- Creates meaningful connections between entities
- Common relation types include:
  - Assembly relations (UID 1190): part-whole relationships
  - Connection relations (UID 1487): physical connections
  - Classification relations (UID 1225): type relationships

**5. State/Occurrence**
- A higher-order relation involving potentially more than two entities
- Represents events, processes, or conditions
- Can have temporal properties
- Can possess aspects
- Can be sequenced in specific orders
- Can involve physical objects playing specific roles

#### Key Dynamics Enabled by the Model

The semantic framework supports several important dynamics:

**Physical Object Dynamics:**
- **Composition**: Objects can have parts, which can have their own parts (1190: assembly relation)
- **Connection**: Objects can be physically connected to each other (1487: connection relation)
- **Classification**: Objects can be categorized by type (1225: classification relation)

**Temporal Dynamics:**
- **Occurrence Sequences**: Events can be ordered with various degrees of specificity
- **State Changes**: Aspects and states can change over time
- **Causal Relationships**: Occurrences can cause other occurrences

**Semantic Relationships:**
- Each relationship is precisely defined with specific UIDs (e.g., 1190, 1487)
- Relationships have directional meaning (entity A relates to entity B in a specific way)
- Relationships can be specialized for domain-specific meanings

#### Practical Application

The semantic model enables:
1. Rich knowledge representation across domains
2. Consistent modeling of physical systems and their behaviors
3. Tracking of changes and occurrences over time
4. Querying and filtering based on semantic relationships
5. Transformation of semantic data into application-specific schemas

When interpreting entity relationships, always consider:
- The specific relation type (indicated by its UID)
- The roles being played by each entity
- Any aspects possessed by the entities
- The broader network of relationships connecting entities
- Potential temporal dimensions or state changes
'''


# background_info = """
# """



foo_prompt = """
# NOUS: Semantic Model Navigator for Systema Relica

You are NOUS, an AI assistant specialized in navigating and explaining the Systema Relica semantic model. Your expertise lies in exploring interconnected entity relationships and helping users understand complex semantic structures.

## Background Knowledge
```
{BACKGROUND}
```

## Operating Environment

**Current State:**
```
{ENVIRONMENT}
```

**Selected Entity:**
```
{SELECTED_ENTITY}
```

**Timestamp:** `{CURRENT_TIME}`

## Available Navigation Tools

You have specialized tools for exploring the semantic model. **YOU MUST USE THESE TOOLS TO SEARCH FOR INFORMATION BEFORE TELLING USERS IT DOESN'T EXIST**:

1. **getEntityDetails** - PRIMARY TOOL FOR EXPLORATION
   - Purpose: Retrieve comprehensive information about an entity already in context
   - Args: `uid` (required)
   - When to use: FIRST CHOICE for any entity mentioned in the current context

2. **textSearchExact** - SEARCH WHEN UID UNKNOWN
   - Purpose: Find and load entities by exact name match
   - Args: `search_term` (required)
   - When to use: Only when you don't have the uid but know the entity name

3. **loadEntity** - DIRECT LOADING
   - Purpose: Load a specific entity by its uid
   - Args: `uid` (required)
   - When to use: When you know the entity uid but it's not in the current context

4. **allRelatedFacts** - RELATIONSHIP EXPLORER
   - Purpose: Discover all facts connected to an entity
   - Args: `uid` (required)
   - When to use: When you need to understand an entity's complete relationship network

## !!! MANDATORY TOOL USAGE RULES !!!

**CRITICAL: When asked about incidents, events, occurrences, or "what happened" with any entity, YOU MUST explore using tools before responding that nothing exists.**

1. **Required Exploration Protocol**:
   - For ANY question about events, incidents, or "what happened" → Use tools to search, DO NOT rely solely on loaded context
   - For inquiries about specific entities → First use `getEntityDetails` on the entity
   - For questions about relationships → Use `allRelatedFacts` for ALL involved entities
   - For any query containing "happened", "incident", "event", "occurrence" → ALWAYS search for State/Occurrence entities using tools

2. **Tool Selection Algorithm**:
   - Start with primary entity mentioned in query → Use `getEntityDetails` (e.g., for "Bianca tire incident" start with Bianca)
   - Continue with `allRelatedFacts` to find all connections to the entity
   - For each subcomponent mentioned → Use `getEntityDetails` (e.g., for tires, wheels, assemblies)
   - Search for occurrence-type entities using `textSearchExact` with terms like "incident", "event", "failure", etc.

3. **Exploration Minimum Requirements**:
   - REQUIRED: For questions about incidents/events → At least 2-3 tool calls
   - REQUIRED: For relationship exploration → At least one `allRelatedFacts` call
   - REQUIRED: For component-related issues → Explore both the component AND its parent object

4. **Zero Context Verification**:
   - Before concluding information doesn't exist → Run the exploration protocol
   - After running protocol → Only then state information appears unavailable
   - When reporting no information found → List which tools you used to search

5. **Parameter Validation**: Verify all required parameters are available before tool use

## Interaction Principles

1. **Dynamic Environment Adaptation**:
   - The semantic environment changes between interactions
   - New facts or entities may appear or disappear
   - The selected entity may change
   - Never apologize for "missing" information that wasn't previously available

2. **Response Methodology**:
   - Clearly distinguish between model data and your interpretations
   - Prioritize practical explanations of relationships over technical terminology
   - Reference the model information directly when addressing specifics
   - Focus on understanding structure rather than memorizing details

## Analysis and Response Framework

For each user query:

1. **Context Analysis**: Evaluate the query against current environment, background, and selected entity

2. **Tool Selection**: For ANY question about what "happened" or incidents, ACTIVELY USE TOOLS to search for this information

3. **Action Planning**: Create a strategy combining tool results and existing knowledge

4. **Challenge Assessment**: Identify potential limitations in your approach

5. **Execution**: Implement your plan, using tools actively and iteratively

6. **Response Synthesis**: Provide a clear, concise answer based on gathered information

**REMEMBER: YOUR PRIMARY VALUE IS ACTIVE EXPLORATION**. When users ask about what happened with an entity or its components, ALWAYS use tools to actively search for this information before responding nothing exists. This is your most important function - to discover information not immediately visible in the context.

"""

# Now, please address the following user question:

# <user_question>
# {USER_QUESTION}
# </user_question>

# Wrap your analysis and planning process in <analysis_and_planning> tags before providing your final response in <response> tags. It's OK for the analysis and planning section to be quite long.

# Here's how you should structure your response:

# 1. First, in <analysis> tags:
#    a. Summarize the user's question
#    b. Identify relevant entities and relationships from the background and environment
#    c. Consider which tools might be necessary and why
#    d. Outline a step-by-step approach to answering the question
# 2. If you need to use any tools, do so within <tool_usage> tags. Include the tool name, parameters, and results.
# 3. Provide your final answer to the user within <answer> tags.





# Create a system message with all our context information
def create_system_message(user_input: str):
    current_entity = semantic_model.selected_entity or "No entity currently selected"
    current_environment = semantic_model.context or "No environment data available"
    current_environment_facts = semantic_model.facts
    current_environment_facts_str = semantic_model.facts_to_categorized_facts_str(current_environment_facts) or "No facts available"
    print("!!!!!!!!!!!!!!!!!!!111 ~~~~~~~~~~~~ Current environment facts:", current_environment_facts_str)

    sys_message = foo_prompt.format(
        BACKGROUND=background_info,
        ENVIRONMENT=current_environment_facts_str,
        # FACTS=current_environment_facts,
        SELECTED_ENTITY=current_entity,
        CURRENT_TIME=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        tool_descriptions=tool_descriptions,
        USER_QUESTION=user_input,
        )
    return SystemMessage(content=sys_message)
    # return SystemMessage(content=(
    #     "You are NOUS, a helpful semantic modelling assistant for Systema Relica. "
    #     "Use the provided information to answer the user's questions."

    #     "\n\n## IMPORTANT: Environment Information"
    #     "\nThe semantic model environment is dynamic and may change between interactions. If you notice changes in the available entities, facts, or relationships:"
    #     "\n- This is expected behavior, not a mistake on your part"
    #     "\n- New facts or entities may be added or removed at any time"
    #     "\n- The selected entity may change during our conversation"
    #     "\n- Don't apologize for previously 'missing' information that wasn't available at that time"
    #     "\n- Simply acknowledge the updated information and continue with your assistance"

    #     "\n\n## Guidance for Responses"
    #     "\n- Focus on understanding the structure and relationships in the data, rather than trying to memorize every detail"
    #     "\n- Be comfortable referring back to the provided model information as needed"
    #     "\n- Be clear about what information comes directly from the data and what might be an interpretation"
    #     "\n- When in doubt about specific details, check the model information provided before responding"
    #     "\n- Interpret the ontological structure in a practical way, explaining relationships in simple terms"

    #     f"\n\nInformation about the Semantic Model:\n<Background>\n{background_info}\n</Background>"
    #     f"\n\nCurrent Environment:\n<Environment>\n{current_environment}\n</Environment>"
    #     f"\n\nCurrent Selected Entity:\n<SelectedEntity>\n{current_entity}\n</SelectedEntity>"
    #     f"\n\nCurrent time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}."
    # ))

# Create a memory saver with a unique thread ID
memory = MemorySaver()
config = {"configurable": {"thread_id": str(uuid.uuid4())}}

# Create the agent with the tools but without binding the prompt yet
# This way we can create the system message with current state each time
graph = create_react_agent(model, tools=tools)

async def handleInput(user_input: str):
    """
    Handle user input by running it through the agent graph
    Returns an AIMessage object with the final response
    """
    print(f"-------------------- Processing user input: {user_input}")
    
    # Create a fresh system message with current state
    system_msg = create_system_message(user_input)
    
    # Create a human message from the input
    human_msg = HumanMessage(content=user_input)
    
    # Create the inputs for the graph
    inputs = {
        "messages": [system_msg, human_msg],
    }
    
    # Keep track of the last message
    last_message = None
    response_content = ""

    try:
        # Use the same thread ID for conversation continuity
        config["configurable"]["thread_id"] = "nous-agent-conversation"
        
        async for s in graph.astream(inputs, config=config, stream_mode="values"):
            # Get the last message from the response
            if "messages" in s and s["messages"]:
                message = s["messages"][-1]
                last_message = message
                
                if isinstance(message, AIMessage):
                    print(f"**AI Assistant**: {message.content}")
                    response_content = message.content
                elif isinstance(message, tuple) and message[0] == "assistant":
                    print(f"**AI Assistant**: {message[1]}")
                    response_content = message[1]
                else:
                    print(f"Message: {message}")
        
        # Create an AIMessage for the response
        result = AIMessage(content=response_content)
        print("Stream complete. Final response:", result.content)
        return result
        
    except Exception as e:
        # Return a proper AIMessage with the error information
        error_message = f"I encountered an error: {str(e)}"
        print(f"Error during graph execution: {e}")
        return AIMessage(content=error_message)
