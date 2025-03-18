import operator
import json
import os
import getpass
import uuid

from typing import Optional, List, Dict, Any

from langgraph.checkpoint.memory import MemorySaver

from src.relica_nous_langchain.utils.EventEmitter import EventEmitter

from src.relica_nous_langchain.SemanticModel import semantic_model

from src.relica_nous_langchain.agent.Common import (
    ACTION_CONTINUE,
    ACTION_FINAL_ANSWER,
)

from typing import TypedDict, Annotated, Sequence
from langgraph.graph import StateGraph

# Import new react_agent and final_answer nodes
from src.relica_nous_langchain.agent.reactAgentNode import react_agent, should_continue_or_finish
from src.relica_nous_langchain.agent.finalAnswerNode import final_answer

# Set API keys if not present
if not os.environ.get("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = getpass.getpass("Enter your OpenAI API key: ")
if not os.environ.get("ANTHROPIC_API_KEY"):
    os.environ["ANTHROPIC_API_KEY"] = getpass.getpass("Enter your Anthropic API key: ")

# Initialize memory saver
memory = MemorySaver()

###############################

# Simplified state definition
class AgentState(TypedDict):
    input: str
    messages: Annotated[list[dict], operator.add]  # Chat history
    answer: Optional[str]
    selected_entity: int
    cut_to_final: bool
    loop_idx: int  # Keep for iteration tracking

###############################

# Create new simplified workflow
workflow = StateGraph(AgentState)

# Add only two nodes: react_agent and final_answer
workflow.add_node("react_agent", react_agent)
workflow.add_node("final_answer", final_answer)

# Set entry point to react_agent
workflow.set_entry_point("react_agent")

# Add conditional edge from react_agent to either itself or final_answer
workflow.add_conditional_edges(
    "react_agent",
    should_continue_or_finish,
    {
        ACTION_CONTINUE: "react_agent",
        ACTION_FINAL_ANSWER: "final_answer",
    }
)

# Set finish point
workflow.set_finish_point("final_answer")

# Compile the workflow
app = workflow.compile(
    checkpointer=memory
)

# Comment out the ASCII drawing that's causing errors
# print(app.get_graph().draw_ascii())

###############################

class NOUSAgent:
    def __init__(self):
        print("NOUS AGENT")
        self.emitter = EventEmitter()
        self.conversation_history: List[Dict[str, Any]] = []
        self.conversation_id = str(uuid.uuid4())  # Generate a unique ID for this conversation

    async def handleInput(self, user_input):
        try:
            # Ensure user_input is a string
            if not isinstance(user_input, str):
                user_input = str(user_input)
                
            print(f"Processing user input: {user_input}")
            
            # Add user message to conversation history
            user_message = {"role": "user", "content": user_input}
            self.conversation_history.append(user_message)
            
            # Initialize state with the full conversation history
            inputs = {
                "input": user_input,
                "loop_idx": 0,
                "selected_entity": semantic_model.selectedEntity,
                "messages": list(self.conversation_history),  # Use the full conversation history
                "answer": None,
                "cut_to_final": False
            }

            fa = ""
            # Create a working copy of the conversation history for this turn
            turn_messages = list(self.conversation_history)

            print("///////////////////// INPUT /////////////////////")
            print(f"Conversation history length: {len(self.conversation_history)}")

            config = {"configurable": {"thread_id": self.conversation_id}}

            # Process the input through the workflow
            async for output in app.astream(inputs, config):
                print("///////////////////// OUTPUT /////////////////////")
                print(output)
                for key, value in output.items():
                    for message in value.get("messages", []):
                        if isinstance(message, dict):
                            turn_messages.append(message)
                            # Extract final answer if present
                            if key == "final_answer":
                                final_answer_content = message["content"].replace("Final Answer: ", "")
                                final_message = {"role": "assistant", "content": final_answer_content}
                                self.conversation_history.append(final_message)
                                self.emitter.emit('final_answer', final_message)
                                fa = final_answer_content
                        else:
                            print(f"Unexpected message format: {message}")
                            # Still add it to turn messages in a properly formatted way
                            turn_messages.append({"role": "assistant", "content": str(message)})

                    self.emitter.emit('chatHistory', turn_messages)

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
            error_message = {'role': 'assistant', 'content': f'Error: {str(e)}'}
            self.conversation_history.append(error_message)
            self.emitter.emit('final_answer', error_message)
            return f"Error: {str(e)}"

nousAgent = NOUSAgent()
