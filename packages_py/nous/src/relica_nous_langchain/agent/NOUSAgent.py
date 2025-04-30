from rich import print
import operator
import json
import os
import getpass
import uuid
import functools

from typing import Optional, List, Dict, Any, TypedDict, Annotated, Sequence
from langgraph.graph import StateGraph

def route_after_action(state):
    return ACTION_FINAL_ANSWER if state["cut_to_final"] else ACTION_THINK

from src.relica_nous_langchain.agent.thoughtNode import thought as thought_node_func
from src.relica_nous_langchain.agent.actionObserveNode import action_observe as action_observe_node_func
from src.relica_nous_langchain.agent.finalAnswerNode import final_answer as final_answer_node_func

from src.relica_nous_langchain.utils.EventEmitter import EventEmitter
from src.relica_nous_langchain.SemanticModel import SemanticModel
from src.relica_nous_langchain.services.aperture_client import ApertureClientProxy

from src.relica_nous_langchain.agent.config import (
    ACTION_FINAL_ANSWER,
    ACTION_THINK,
)

# Simplified state definition
class AgentState(TypedDict):
    user_id: int
    env_id: int
    input: str
    messages: Annotated[list[dict], operator.add]  # Chat history
    scratchpad: str
    thought: Optional[str]  # Added to store the current thought
    answer: Optional[str]
    selected_entity: int
    cut_to_final: bool
    loop_idx: int  # Keep for iteration tracking
    next_step: str  # Added to track routing between nodes

# Set API keys if not present
if not os.environ.get("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = getpass.getpass("Enter your OpenAI API key: ")
if not os.environ.get("ANTHROPIC_API_KEY"):
    os.environ["ANTHROPIC_API_KEY"] = getpass.getpass("Enter your Anthropic API key: ")

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

        # --- Define and compile the workflow *within* init --- #
        workflow = StateGraph(AgentState)

        # Bind instance-specific context to node functions using partial
        bound_thought_node = functools.partial(
            thought_node_func,
            aperture_client=self.aperture_client,
            semantic_model=self.semantic_model,
            tools=self.tools,
            converted_tools=self.converted_tools,
            tool_descriptions=self.tool_descriptions,
            tool_names=self.tool_names
        )
        bound_action_observe_node = functools.partial(
            action_observe_node_func,
            aperture_client=self.aperture_client,
            semantic_model=self.semantic_model,
            tools=self.tools,
            converted_tools=self.converted_tools,
            tool_descriptions=self.tool_descriptions,
            tool_names=self.tool_names
        )
        bound_final_answer_node = functools.partial(
            final_answer_node_func,
            semantic_model=self.semantic_model
        )

        # Add nodes using the bound functions
        workflow.add_node("thought_agent", bound_thought_node)
        workflow.add_node("action_observe_agent", bound_action_observe_node)
        workflow.add_node("final_answer", bound_final_answer_node) # Use bound final answer

        # Set entry point
        workflow.set_entry_point("thought_agent")

        workflow.add_edge("thought_agent", "action_observe_agent")

        workflow.add_conditional_edges(
            "action_observe_agent",
            route_after_action, # route_after_action only needs state (check implementation if unsure)
            {
                ACTION_THINK: "thought_agent",
                ACTION_FINAL_ANSWER: "final_answer"
            }
        )

        # Set finish point
        workflow.set_finish_point("final_answer")

        # Compile the workflow and store it as an instance variable
        self.app = workflow.compile()
        # print(self.app.get_graph().draw_ascii()) # Optional: Draw graph for debugging

        self.conversation_id = str(uuid.uuid4())  # Generate a unique ID for this agent instance
        print(f"NOUS Agent Initialized (ID: {self.conversation_id})")

    async def handleInput(self, messages):
        # Note: user_id and env_id are now part of self.aperture_client
        # They might still be needed for the initial state if nodes rely on them directly from state

        user_input = messages[-1]['content']

        user_id = self.aperture_client.user_id
        env_id = self.aperture_client.env_id

        print("==================== NOUS AGENT HANDLE INPUT ===================")
        print(f"User ID: {user_id}")
        print(f"Env ID: {env_id}")


        # Initial state for the LangGraph workflow
        initial_state = AgentState(
            input=user_input,
            messages=messages, # Start with the user message
            scratchpad="",  # Initialize empty scratchpad
            thought=None,
            answer=None,   # Initialize answer as None
            selected_entity=self.semantic_model.selected_entity, # Get current selection
            cut_to_final=False, # Initialize cut_to_final
            loop_idx=0, # Start loop index at 0
            user_id=user_id, # Include user_id if nodes need it from state
            env_id=env_id, # Include env_id if nodes need it from state
            next_step="" # Initial next step is empty
        )

        # Use the instance-specific compiled graph (self.app)
        # config = {"configurable": {"thread_id": self.conversation_id}} # Config for checkpointers if used

        # Stream the response from the LangGraph workflow
        final_state = None
        print("Invoking agent graph...")
        try:
            final_state = await self.app.ainvoke(
                initial_state,
                # config=config # Include config if using checkpointers
            )

        except Exception as e:
            print(f"Error invoking agent graph: {e}")
            import traceback
            traceback.print_exc()
            # Handle error, maybe return an error message or raise
            return f"An error occurred during agent execution: {e}"

        print("Agent graph invocation complete.")

        if final_state:
            print("Final State:", final_state)
            # Extract the final answer from the state
            final_answer = final_state.get('answer', "No answer generated.")
            return final_answer
        else:
            return "Agent did not produce a final answer."
