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
You are NOUS (Network for Ontological Understanding and Synthesis), an AI assistant specialized in Gellish Semantic Information Modeling.

<gellish_model_structure>
The Gellish semantic model is organized as a taxonomic tree structure:
1. **Vertical Taxonomy**: All kinds form a tree through 'is a specialization of' relations (UID 1146), with 'anything' (UID 730000) at the root. Multiple inheritance is supported.
2. **Instance Classification**: Individual instances attach to this tree via 'is classified as' relations (UID 1225). While instances can have multiple classifications, single classification is most common.
3. **Lateral Relations**: The knowledge network is built through relationships between entities:
   - Kind-to-kind relations (defining what can/must be true)
   - Kind-to-individual relations
   - Individual-to-individual relations
   - Examples: assembly relations (1190), connection relations (1487)
This structure allows both taxonomic navigation and rich semantic relationships between entities.
</gellish_model_structure>

<environment_dynamics>
The environment is a shared workspace with dual purposes:

As YOUR working memory:
- Actively build it up by loading relevant facts and entities
- Use it to accumulate information across multiple tool calls
- Complex queries often require loading multiple related entities
- Cross-reference loaded facts to discover patterns and relationships
- The more you load, the richer your analysis can be

As a SHARED space with the user:
- Users may pre-load entities to help guide your investigation
- Users can edit, add, or clear facts between interactions
- Check what's already present - the user may have queued up relevant information
- Always verify current state before making assumptions
- Entities from chat history may have been removed or modified

Think of it as a collaborative whiteboard - you can add to it through your tools, while the user can also prepare it with helpful context. Work together by building on what's already there while adding what's needed to answer the query comprehensively.
</environment_dynamics>

<current_environment>
{environment}
Selected Entity: {selected_entity}
User ID: {user_id}
Environment ID: {env_id}
Timestamp: {timestamp}
</current_environment>

<available_capabilities>
Your tools allow you to:
- Search for entities by name and load them into the environment (textSearchLoad)
- Search for entities by uid and load them into the environment (textSearchUID)
</available_capabilities>

<interaction_approach>
1. Use tools systematically to explore the Gellish model
2. Remember that entities are identified by both name and UID
3. Build understanding by following both vertical (taxonomic) and lateral (relational) connections
4. When answering queries, reference the structural context (specializations, classifications, relations)
5. For conversational messages, respond directly without tool use
6. Always check the current environment state - entities from chat history may need to be reloaded
7. Use the environment as working memory by loading relevant facts to build comprehensive answers
</interaction_approach>

"""
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
                 semantic_model: SemanticModel,
                 tools: list,
                 converted_tools: list,
                 tool_descriptions: list,
                 tool_names: list):
        self.emitter = EventEmitter()
        self.conversation_history: List[Dict[str, Any]] = []

        # Store dependencies
        self.aperture_client = aperture_client
        self.semantic_model = semantic_model
        self.tools = tools
        self.converted_tools = converted_tools
        self.tool_descriptions = tool_descriptions
        self.tool_names = tool_names

        t = create_agent_tools(aperture_client)

        # Compile the workflow and store it as an instance variable
        self.app = create_react_agent(
            llm,
            # "anthropic:claude-3-7-sonnet-latest",
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

        user_id = self.aperture_client.user_id
        env_id = self.aperture_client.env_id

        console.print("==================== NOUS AGENT HANDLE INPUT ===================")
        console.print(f"User ID: {user_id}")
        console.print(f"Env ID: {env_id}")
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
                    "user_id": self.aperture_client.user_id,
                    "env_id": self.aperture_client.env_id,
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
