import operator
import json
import os
import getpass
import uuid

from typing import Optional, List, Dict, Any

# from langgraph.checkpoint.memory import MemorySaver

from src.relica_nous_langchain.utils.EventEmitter import EventEmitter

from src.relica_nous_langchain.SemanticModel import semantic_model

from src.relica_nous_langchain.agent.Common import (
    ACTION_CONTINUE,
    ACTION_FINAL_ANSWER,
    ACTION_THINK,
    ACTION_ACT,
)

from typing import TypedDict, Annotated, Sequence
from langgraph.graph import StateGraph

# Import bifurcated agent nodes
from src.relica_nous_langchain.agent.reactAgentNode import (
    # thought_agent,
    # action_observe_agent,
    route_after_thought,
    route_after_action,
    should_continue_or_finish
)

from src.relica_nous_langchain.agent.thoughtNode import thought
from src.relica_nous_langchain.agent.actionObserveNode import action_observe
from src.relica_nous_langchain.agent.shouldContinueNode import should_continue


from src.relica_nous_langchain.agent.finalAnswerNode import final_answer

# Set API keys if not present
if not os.environ.get("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = getpass.getpass("Enter your OpenAI API key: ")
if not os.environ.get("ANTHROPIC_API_KEY"):
    os.environ["ANTHROPIC_API_KEY"] = getpass.getpass("Enter your Anthropic API key: ")

# Initialize memory saver
# memory = MemorySaver()

###############################

# Simplified state definition
class AgentState(TypedDict):
    input: str
    messages: Annotated[list[dict], operator.add]  # Chat history
    scratchpad: str
    thought: Optional[str]  # Added to store the current thought
    answer: Optional[str]
    selected_entity: int
    cut_to_final: bool
    loop_idx: int  # Keep for iteration tracking
    next_step: str  # Added to track routing between nodes

###############################

# Create new bifurcated workflow
workflow = StateGraph(AgentState)

# Add nodes for thought, action/observe, and final_answer
workflow.add_node("thought_agent", thought)
workflow.add_node("action_observe_agent", action_observe)
workflow.add_node("final_answer", final_answer)

# Set entry point to thought_agent
workflow.set_entry_point("thought_agent")

workflow.add_conditional_edges(
    "thought_agent",
    should_continue,
    {
        ACTION_CONTINUE: "action_observe_agent",
        ACTION_FINAL_ANSWER: "final_answer"
    }
)

# Add conditional edge from thought_agent based on the returned next_step
# workflow.add_conditional_edges(
#     "thought_agent",
#     route_after_thought,
#     {
#         ACTION_ACT: "action_observe_agent",
#         ACTION_FINAL_ANSWER: "final_answer"
#     }
# )

# Add conditional edge from action_observe_agent based on the returned next_step
workflow.add_conditional_edges(
    "action_observe_agent",
    route_after_action,
    {
        ACTION_THINK: "thought_agent",
        ACTION_FINAL_ANSWER: "final_answer"
    }
)

# Set finish point
workflow.set_finish_point("final_answer")

# Compile the workflow
app = workflow.compile(
    # checkpointer=memory
)

# Comment out the ASCII drawing that's causing errors
# print(app.get_graph().draw_ascii())

###############################

class NOUSAgent:
    def __init__(self):
        self.emitter = EventEmitter()
        self.conversation_history: List[Dict[str, Any]] = []
        self.conversation_id = str(uuid.uuid4())  # Generate a unique ID for this conversation
        print("NOUS AGENT", self.conversation_id)

    async def handleInput(self, user_input):
        try:
            # Ensure user_input is a string
            if not isinstance(user_input, str):
                user_input = str(user_input)
                
            print(f"Processing user input: {user_input}")
            
            # Add user message to conversation history if not a duplicate
            is_duplicate = False
            if self.conversation_history and self.conversation_history[-1]["role"] == "user" and self.conversation_history[-1]["content"] == user_input:
                is_duplicate = True
                print("Duplicate user message detected, not adding to history")
            
            if not is_duplicate:
                user_message = {"role": "user", "content": user_input}
                self.conversation_history.append(user_message)
            
            # Create a clean copy of the conversation history for the model
            # This prevents the model from getting confused by duplicate messages
            clean_history = []
            seen_messages = set()
            
            for msg in self.conversation_history:
                # Create a unique key for each message based on role and content
                msg_key = f"{msg['role']}:{msg['content'][:50]}"
                if msg_key not in seen_messages:
                    clean_history.append(msg)
                    seen_messages.add(msg_key)
            
            # Initialize state with the clean history
            inputs = {
                "input": user_input,
                "loop_idx": 0,
                "selected_entity": semantic_model.selectedEntity,
                "messages": clean_history,
                "scratchpad": "",
                "thought": "",
                "answer": None,
                "cut_to_final": False,
                "next_step": ACTION_THINK
            }

            fa = ""
            print("///////////////////// INPUT /////////////////////")
            print(f"Conversation history length: {len(clean_history)}")

            config = {"configurable": {"thread_id": self.conversation_id}}

            # Process the input through the workflow
            async for output in app.astream(inputs, config):
                print("///////////////////// OUTPUT /////////////////////")
                print(output)
                for key, value in output.items():
                    if key == "final_answer":
                        # Format the final answer as a message
                        fa = value["answer"]
                        message = {"role": "assistant", "content": fa}
                        
                        # Only add if not a duplicate of the last assistant message
                        should_add = True
                        for i in range(len(self.conversation_history) - 1, -1, -1):
                            if self.conversation_history[i]["role"] == "assistant":
                                if self.conversation_history[i]["content"] == fa:
                                    should_add = False
                                break
                        
                        if should_add:
                            self.conversation_history.append(message)
                        
                        # Always emit the chat history and final answer
                        self.emitter.emit('chatHistory', self.conversation_history)
                        self.emitter.emit('final_answer', message)

            # Ensure we have a fallback response if something goes wrong
            if not fa:
                fa = "I'm sorry, I wasn't able to process your request properly. Could you please try again?"
                fallback_message = {"role": "assistant", "content": fa}
                self.conversation_history.append(fallback_message)
                self.emitter.emit('final_answer', fallback_message)

            # Print conversation history for debugging
            print("///////////////////// CONVERSATION HISTORY /////////////////////")
            for idx, msg in enumerate(self.conversation_history):
                print(f"{idx}. {msg['role']}: {msg['content'][:50]}...")

            return fa

        except Exception as e:
            print("An error occurred:", str(e))
            print("Full error:", e)  # Add full error info
            error_message = {'role': 'assistant', "content": f"Error: {str(e)}"}
            self.conversation_history.append(error_message)
            self.emitter.emit('final_answer', error_message)
            return f"Error: {str(e)}"

nousAgent = NOUSAgent()
