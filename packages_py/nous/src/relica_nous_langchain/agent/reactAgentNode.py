#!/usr/bin/env python3

from datetime import datetime
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import ToolNode
from langchain_core.messages import AIMessage

from src.relica_nous_langchain.agent.Common import (
    anthropicModel,
    format_chat_history,
    ACTION_FINAL_ANSWER,
    ACTION_CONTINUE,
    ACTION_THINK,
    ACTION_ACT,
    )
from src.relica_nous_langchain.agent.Tools import (
    converted_tools,
    tool_descriptions,
    tool_names,
    tools,
    )
from src.relica_nous_langchain.SemanticModel import semantic_model

# Maximum number of iterations to prevent infinite loops
MAX_ITERATIONS = 5

# Set up the tool node
tool_node = ToolNode(tools)

# Combined LLM for the React agent
react_llm = ChatAnthropic(
    model=anthropicModel,
    temperature=0.7,
    max_tokens=500,
    timeout=None,
    max_retries=2,
).bind_tools(tools)

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

def format_conversation_for_prompt(messages):
    """
    Format the conversation history in a clear, readable format for the prompt.
    Only include actual user-assistant exchanges, not internal thought processes.
    """
    if not messages:
        return "No previous conversation."

    formatted = "Previous conversation:\n"
    for msg in messages:
        role = msg.get('role', 'unknown')
        content = msg.get('content', '')

        # Skip internal thought messages and only include clean user-assistant exchanges
        if role in ['user', 'assistant'] and not content.startswith("Thought:") and not content.startswith("Action:") and not content.startswith("Observation:"):
            # For assistant messages that start with "Final Answer:", clean them up
            if content.startswith("Final Answer:"):
                content = content.replace("Final Answer:", "").strip()

            formatted += f"{role}: {content}\n"

    return formatted

async def react_agent(state):
    print("/////////////////// REACT AGENT BEGIN /////////////////////")

    # Get input - we use only the current input, not message history
    input_text = state['input']
    scratchpad = state.get('scratchpad', "")
    messages = state.get('messages', [])

    # Format the conversation history for the prompt
    formatted_history = format_conversation_for_prompt(messages)

    # Update loop counter
    loop_idx = state.get('loop_idx', 0) + 1

    # Check if we've exceeded the maximum number of iterations
    if loop_idx > MAX_ITERATIONS:
        return {
            "scratchpad": scratchpad + f"\n\n!!!ATTENTION!!! : Reached maximum iteration limit ({MAX_ITERATIONS}). Moving to final answer.",
            "loop_idx": loop_idx,
            "cut_to_final": True
        }

    # Don't rely on history from state - just focus on current question
    print(f"REACT: Processing question: {input_text}")
    
    # Create combined prompt for thought-action-observation
    prompt = f"""You are NOUS (Network for Ontological Understanding and Synthesis), an AI assistant.

Background information about the semantic model:
{background_info}

Current selected entity:
{semantic_model.selectedEntity}

Currently loaded semantic context:
{semantic_model.format_relationships()}

Follow the ReAct (Reasoning + Acting) process to answer the user's question:
1. Think about what information you need and how to get it.(thought)
2. Choose an appropriate tool to use.(action)
3. Analyze the results and decide if you need more information or can provide a final answer.(observation)

Available tools:
{tool_descriptions}

Format your response with:
<thought>Your step-by-step reasoning about the problem</thought>

Then, if you need more information, use one of the available tools.
If you have enough information to provide a final answer, respond with "FINAL_ANSWER: [your answer]"

Current Date and Time: {datetime.now().strftime("%Y-%m-%d %H:%M")}

You are on iteration {loop_idx} of {MAX_ITERATIONS} maximum iterations.

Conversation history:
{formatted_history}

Current question:
{input_text}

Scratchpad:
{scratchpad}
"""

    # Make the LLM call for combined reasoning, action selection, and observation
    response = await react_llm.ainvoke([("system", prompt), ("human", input_text)])

    print("/////////////////// REACT AGENT RESPONSE TYPE /////////////////////")
    print(f"Response type: {type(response)}")
    print("Response content type:", type(response.content))
    
    print("/////////////////// REACT AGENT RESPONSE /////////////////////")
    print(response)
    
    # Handle the extraction of thought content correctly
    thought_content = ""
    final_answer = None
    
    # Check for tool calls first (these take precedence)
    has_tool_calls = hasattr(response, 'tool_calls') and response.tool_calls
    
    # Special handling for cutToFinalAnswer tool
    if has_tool_calls:
        for tool_call in response.tool_calls:
            if tool_call["name"] == "cutToFinalAnswer":
                # Extract the message from the tool call
                final_answer = tool_call["args"].get("message", "I'm here to help!")
                break
    
    # Handle the case where response.content is a list (Anthropic's format)
    if isinstance(response.content, list):
        # Look for text chunks with thought tags
        for chunk in response.content:
            if isinstance(chunk, dict) and chunk.get('type') == 'text':
                text = chunk.get('text', '')
                
                # Extract thought content if present
                if '<thought>' in text and '</thought>' in text:
                    thought_parts = text.split('</thought>')
                    thought_content = thought_parts[0].split('<thought>')[1].strip()
                
                # Look for final answer if not already set by tool call
                if not final_answer and 'FINAL_ANSWER:' in text:
                    final_answer = text.split('FINAL_ANSWER:')[1].strip()
    else:
        # Handle as a string (fallback)
        text_content = str(response.content)
        
        # Extract thought content
        if '<thought>' in text_content and '</thought>' in text_content:
            thought_parts = text_content.split('</thought>')
            thought_content = thought_parts[0].split('<thought>')[1].strip()
        
        # Look for final answer if not already set by tool call
        if not final_answer and 'FINAL_ANSWER:' in text_content:
            final_answer = text_content.split('FINAL_ANSWER:')[1].strip()
    
    # If no thought content was extracted, provide a fallback
    if not thought_content:
        thought_content = "Analyzing the query and determining the best response."
    
    scratchpad = scratchpad + f"\n\nThought: {thought_content}"

    print("/////////////////// REACT AGENT THOUGHT /////////////////////")
    print(thought_content)

    # Check if we have a final answer from any method
    if final_answer:
        # Clean up the output to ensure consistent formatting 
        final_answer = final_answer.strip()
        return {
            "scratchpad": scratchpad + f"\n\nFinal Answer: {final_answer}",
            "loop_idx": loop_idx,
            "cut_to_final": True,
            "answer": final_answer
        }

    print("/////////////////// REACT AGENT TOOL CALLS /////////////////////")
    print(response.tool_calls if has_tool_calls else "No tool calls")

    # Handle regular tool calls if present (not cutToFinalAnswer)
    if has_tool_calls:
        # Get the first tool call that isn't cutToFinalAnswer
        for tool_call in response.tool_calls:
            if tool_call["name"] != "cutToFinalAnswer":
                action_name = tool_call["name"]
                action_arguments = tool_call["args"]
                
                # Execute the tool
                ai_message = AIMessage(
                    content="",
                    tool_calls=[
                        {
                            "name": action_name,
                            "args": action_arguments,
                            "id": tool_call.get("id", "tool_call_id"),
                            "type": "tool_call",
                        }
                    ],
                )
                
                # Get the tool response
                tool_result = await tool_node.ainvoke({"messages": [ai_message]})
                tool_messages = tool_result.get("messages", [])
                tool_response = tool_messages[0].content if tool_messages else "No response from tool"
                
                return {
                    "scratchpad": scratchpad + f"\n\nAction: {action_name}\nAction Input: {action_arguments}\nObservation: {tool_response}",
                    "loop_idx": loop_idx,
                    "cut_to_final": False
                }
    
    # Fallback if no tool calls or final answer is detected
    return {
        "scratchpad": scratchpad + "\n\nNo clear action or final answer determined. Moving to next step",
        "loop_idx": loop_idx,
        "cut_to_final": True,  # Changed to true to avoid loops when no clear path
        "answer": "I'm not sure how to proceed with this request. Could you provide more information or clarify what you're looking for?"
    }

# Simple condition function to determine if we should continue or finish
def should_continue_or_finish(state):
    return ACTION_FINAL_ANSWER if state["cut_to_final"] else ACTION_CONTINUE

def route_after_thought(state):
    return ACTION_FINAL_ANSWER if state["cut_to_final"] else ACTION_ACT

def route_after_action(state):
    return ACTION_FINAL_ANSWER if state["cut_to_final"] else ACTION_THINK
