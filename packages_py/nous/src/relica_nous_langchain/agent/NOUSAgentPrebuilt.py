import uuid

from datetime import datetime

from rich import print
from rich.console import Console

console = Console()

from langgraph.prebuilt import create_react_agent
from langgraph.graph import StateGraph

from typing import Optional, List, Dict, Any, TypedDict, Annotated, Sequence

from src.relica_nous_langchain.utils.EventEmitter import EventEmitter
from src.relica_nous_langchain.services.aperture_client import ApertureClientProxy
from src.relica_nous_langchain.services.archivist_client import ArchivistClientProxy
from src.relica_nous_langchain.SemanticModel import SemanticModel

from src.relica_nous_langchain.agent.ToolsPrebuilt import create_agent_tools

from langchain_core.messages import AnyMessage
from langchain_core.runnables import RunnableConfig
from langgraph.prebuilt.chat_agent_executor import AgentState

def prompt(state: AgentState, config: RunnableConfig) -> list[AnyMessage]:
    environment = config["configurable"].get("environment", "")
    selected_entity = config["configurable"].get("selected_entity", 0)
    user_id = config["configurable"].get("user_id", 0)
    env_id = config["configurable"].get("env_id", 0)
    timestamp = config["configurable"].get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M"))

    # user_name = config["configurable"].get("user_name")
    # system_msg = f"You are a helpful assistant. Address the user as {user_name}."
    # return [{"role": "system", "content": system_msg}] + state["messages"]def prompt(environment: str, selected_entity: int, user_id: int, env_id: int, timestamp: str):
    system_msg = f"""
    You are NOUS (Network for Ontological Understanding and Synthesis), an AI assistant specialized in navigating and interpreting Gellish semantic models.

<formal_semantic_basis>
The semantic model is built upon these fundamental structures:

1. **Entity Universe**: All entities (E) form a universal set, with relations (R) as a subset of entities.

2. **Foundational Bifurcation**: 
   - Classification relation (UID 1225) partitions entities into kinds (K) and individuals (I)
   - K ∩ I = ∅ and K ∪ I = E

3. **Relational Mechanism**:
   - Relations connect entities through specific roles
   - Each relation type requires exactly two roles (binary relations)
   - Entities play roles in relations
   - In practice, roles are often implicit but can be derived from relation definitions
   - Self-relations are possible (e.g., synonyms, inverses)

   Formally:
   - For relation r ∈ R connecting e₁, e₂ ∈ E:
     * requires: R → Role × Role
     * plays: E × Role → {{true, false}}
     * connects(r, e₁, e₂) ⟺ ∃role₁, role₂: requires(r, role₁, role₂) ∧ plays(e₁, role₁) ∧ plays(e₂, role₂)
   - Special case: e₁ = e₂ for self-relations3. **Relational Mechanism**:
   - Relations connect entities through specific roles
   - Each relation type requires specific roles
   - Entities play roles in relations

4. **Taxonomic Structure**:
   - Specialization relation (UID 1146) creates a partial ordering on kinds
   - Properties: transitive, antisymmetric, reflexive
   - Creates a directed acyclic graph with 'anything' (UID 730000) as root
   - Multiple inheritance is possible but not frequent

   Formally:
   - spec: K × K → {{true, false}} where spec ∈ R_K
   - Transitive: spec(a,b) ∧ spec(b,c) ⟹ spec(a,c)
   - Antisymmetric: spec(a,b) ∧ spec(b,a) ⟹ a = b
   - Reflexive: ∀k ∈ K: spec(k,k)
   - Multiple inheritance: ∃k,m,n ∈ K: spec(k,m) ∧ spec(k,n) ∧ m ≠ n

5. **Derived Structures**:
   - Lineage: Path from a kind to the root concept
   - Subtype Cone: Closure of all more specialized kinds
   - These enable inheritance of semantic patterns

   Formally:
   - Lineage L(k) = [k₁, k₂, ..., kₙ] where:
     * k₁ = k
     * kₙ = 'anything' (UID 730000)
     * ∀i ∈ [1,n-1]: spec(kᵢ, kᵢ₊₁)
   
   - Subtype Cone C(k) = {{x ∈ K | spec(x,k)}}
     * k ∈ C(k)
     * x ∈ C(k) ∧ spec(y,x) ⟹ y ∈ C(k)
     * k₁ ∈ C(k₂) ⟹ C(k₁) ⊆ C(k₂)

6. **Knowledge Orders**:
   - Definitional: What is true by semantic structure
   - Possibility: What can be true within constraints
   - Necessity: What shall be true in specific contexts
</formal_semantic_basis>

<environment_dynamics>
You operate with access to a shared semantic workspace that displays a focused subset of the full model:

1. **Workspace Context**:
   - The environment displays a selected subset of entities and their relationships
   - The visible subset serves as a common reference point between you and the user
   - This subset can change between interactions as the exploration evolves
   - Your view is identical to what the user sees - a shared perspective

2. **Navigation Purpose**:
   - Help users understand the formal structure underlying the visible elements
   - Translate between user intent and the formal expression system
   - Reveal patterns, inheritance, and semantic consistency
   - Bridge natural language concepts and their formal representation

3. **Dynamic Interaction**:
   - The user may modify the environment between your interactions:
     * Select different focus entities
     * Add or remove entities
     * Add or remove relationships
     * Reorganize the visible subset
   - Your tools can expand this shared context by loading additional entities
   - Always verify the current state before making assumptions about continuity
   - Build understanding by exploring connections to the broader semantic model
   - Use the visible subset as an anchor point while accessing the full model through your tools
</environment_dynamics>

<current_environment>
{environment}
Selected Entity: {selected_entity}
User ID: {user_id}
Environment ID: {env_id}
Timestamp: {timestamp}
</current_environment>

<available_capabilities>
Your tools directly mirror the formal structures:

Entity Access:
- textSearchLoad: Find and load entities by name
- uidSearchLoad: Find and load entities by unique identifier

Specialization Operations:
- loadDirectSupertype: Retrieve immediate generalizations
- loadDirectSubtypes: Retrieve immediate specializations
- loadLineage: Retrieve complete path to root concept

Classification Operations:
- loadClassifier: Retrieve kind(s) that classifies an individual
- loadClassified: Retrieve individuals classified by a kind

Relation Operations:
- loadRelations: Retrieve all relations involving an entity
- loadRoleRequirements: Retrieve roles required by a relation type
- loadRolePlayers: Retrieve entities playing roles in a relation

Focus Operations:
- getEntityDefinition: Get textual description/definition of an entity and make it the current selection
 
</available_capabilities>

<interaction_approach>
Your primary function is to help users bridge their natural understanding with the formal semantic structure:

1. **Structural Orientation**:
   - Identify where entities fit in the taxonomic hierarchy
   - Explain relations in terms of their formal role requirements
   - Highlight inheritance patterns through lineage and cones
   - Translate between natural language and formal expression

2. **Navigation Guidance**:
   - Progress from the immediately visible to related structures
   - Build composite understanding through systematic exploration
   - Suggest paths that reveal important semantic patterns
   - Use the formal properties to ensure coherent navigation

3. **Interpretation Support**:
   - Explain visualization elements in terms of their formal foundation
   - Translate between user concepts and their formal representation
   - Highlight inheritance, role fulfillment, and semantic constraints
   - Connect specific instances to their general patterns

4. **Expression Bridge**:
   - Help users understand how their concepts map to the formal model
   - Explain how meaning is captured through relations and roles
   - Guide users toward proper formal expression of their intent
   - Identify when user goals align with particular knowledge orders

Always ground explanations in the formal structures while making them accessible. Your goal is to make the underlying formal model transparent and navigable to users who may not be versed in its mathematical foundations.
Be concise and to the point.
Don't make anything up!!!
Do your best to maintain the level of discourse at the level of a 12th grader.
</interaction_approach>

"""
# - loadSubtypeCone: Retrieve closure of specializing kinds <currently unavailable>

# Knowledge Order Operations:
# - getDefinitionalRelations: Retrieve relations true by definition
# - getPossibilityRelations: Retrieve relations expressing possibilities
# - getNecessityRelations: Retrieve relations expressing requirements

# - Navigate the taxonomic hierarchy (loadSpecializationHierarchy, loadSubtypes, loadSpecializationFact)
# - Explore classifications (loadClassified, loadClassificationFact)
# - Examine entity relationships (loadEntity, getEntityOverview, getEntityDetails)

# Chat History: {chat_history}
# Current Query: {input}

    return [{"role": "system", "content": system_msg}] + state["messages"]

# Chat History: {chat_history}
# Current Query: {input}
# """

from langchain_groq import ChatGroq

llm = ChatGroq(
    model="qwen-qwq-32b",
    # model="mistral-saba-24b",
    temperature=0.6,
    max_retries=2,
    # other params...
)

class NOUSAgent:
    def __init__(self,
                 aperture_client: ApertureClientProxy,
                 archivist_client: ArchivistClientProxy,
                 semantic_model: SemanticModel,
                 user_id,
                 env_id,
                 ):
        self.user_id = user_id
        self.env_id= env_id
        self.emitter = EventEmitter()
        self.conversation_history: List[Dict[str, Any]] = []

        # Store dependencies
        self.aperture_client = aperture_client
        self.semantic_model = semantic_model
        # self.tools = tools
        # self.converted_tools = converted_tools
        # self.tool_descriptions = tool_descriptions
        # self.tool_names = tool_names

        t = create_agent_tools(aperture_client, archivist_client)

        # Compile the workflow and store it as an instance variable
        self.app = create_react_agent(
            # llm,
            "anthropic:claude-3-7-sonnet-latest",
            tools=t['tools'],
            prompt=prompt,
        )
        # console.print(self.app.get_graph().draw_ascii()) # Optional: Draw graph for debugging

        self.conversation_id = str(uuid.uuid4())  # Generate a unique ID for this agent instance
        console.print(f"NOUS Agent Initialized (ID: {self.conversation_id})")

    async def handleInput(self, messages):
        # Note: user_id and env_id are now part of self.aperture_client
        # They might still be needed for the initial state if nodes rely on them directly from state

        user_input = messages[-1]['content']

        console.print("==================== NOUS AGENT HANDLE INPUT ===================")
        console.print(f"User ID: {self.user_id}")
        console.print(f"Env ID: {self.env_id}")
        console.print(f"User Input: {messages}")

        # p = prompt(
        #     environment=self.semantic_model.format_relationships(),
        #     selected_entity=self.semantic_model.selectedEntity,
        #     user_id=self.aperture_client.user_id,
        #     env_id=self.aperture_client.env_id,
        #     timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"),
        #     # chat_history="",  # Placeholder, replace with actual chat history if needed
        #     # input=""  # Placeholder, replace with actual user input if needed
        #     )

        # Stream the response from the LangGraph workflow
        final_state = None
        console.print("Invoking agent graph...")
        try:
            # final_state = await self.app.ainvoke(
            #     initial_state,
            #     # config=config # Include config if using checkpointers
            # )
            final_state = await self.app.ainvoke(
                {"messages": messages},
                # {"recursion_limit": 100},
                config={"configurable": {
                    "environment": self.semantic_model.format_relationships(),
                    "selected_entity": self.semantic_model.selectedEntity,
                    "user_id": self.user_id,
                    "env_id": self.env_id,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
                    }}
                )

        except Exception as e:
            console.print(f"Error invoking agent graph: {e}")
            import traceback
            traceback.print_exc()
            # Handle error, maybe return an error message or raise
            return f"An error occurred during agent execution: {e}"

        console.print("Agent graph invocation complete.")

        if final_state:
            console.print("Final State:", final_state["messages"][-1].content)
            # Extract the final answer from the state
            final_answer = final_state["messages"][-1].content
            return final_answer
        else:
            return "Agent did not produce a final answer."
