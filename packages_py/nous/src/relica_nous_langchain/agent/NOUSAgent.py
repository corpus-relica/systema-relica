import operator
import json
import os
import getpass
import uuid

from typing import Optional

from langgraph.checkpoint.memory import MemorySaver

from src.relica_nous_langchain.utils.EventEmitter import EventEmitter

from src.relica_nous_langchain.SemanticModel import semantic_model

from src.relica_nous_langchain.agent.Common import (
    NODE_REACT,
    NODE_THOUGHT,
    NODE_ACTION,
    NODE_OBSERVATION,
    NODE_FINAL_ANSWER,

    ACTION_CONTINUE,
    ACTION_FINAL_ANSWER,
)


from typing import TypedDict, Annotated, Sequence
from langgraph.graph import StateGraph

from src.relica_nous_langchain.agent.reactNode import react
from src.relica_nous_langchain.agent.thoughtNode import thought
from src.relica_nous_langchain.agent.actionNode import action
from src.relica_nous_langchain.agent.observationNode import observation
from src.relica_nous_langchain.agent.finalAnswerNode import final_answer
from src.relica_nous_langchain.agent.shouldCutToTheChaseNode import should_cut_to_the_chase


if not os.environ.get("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = getpass.getpass("Enter your OpenAI API key: ")
if not os.environ.get("ANTHROPIC_API_KEY"):
    os.environ["ANTHROPIC_API_KEY"] = getpass.getpass("Enter your Anthropic API key: ")


memory = MemorySaver() #ConversationBufferMemory(return_messages=True)


###############################


class AgentState(TypedDict):
    loop_idx: int
    input: str
    messages: Annotated[list[dict], operator.add]  # Chat history now part of state
    answer: Optional[str]
    selected_entity: int
    cut_to_final: bool


###############################


workflow = StateGraph(AgentState)

workflow.add_node(NODE_REACT, react)
workflow.add_node(NODE_THOUGHT, thought)
workflow.add_node(NODE_ACTION, action)
workflow.add_node(NODE_OBSERVATION, observation)
workflow.add_node(NODE_FINAL_ANSWER, final_answer)

workflow.set_entry_point(NODE_REACT)

workflow.add_edge(NODE_REACT, NODE_THOUGHT)
workflow.add_edge(NODE_THOUGHT, NODE_ACTION)
workflow.add_edge(NODE_ACTION, NODE_OBSERVATION)
workflow.add_conditional_edges(
    NODE_OBSERVATION,
    should_cut_to_the_chase,
    {
        ACTION_CONTINUE: NODE_THOUGHT,
        ACTION_FINAL_ANSWER: NODE_FINAL_ANSWER,
    }
)

workflow.set_finish_point(NODE_FINAL_ANSWER)

app = workflow.compile(
    checkpointer=memory
)

print(app.get_graph().draw_ascii())


###############################


class NOUSAgent:
    def __init__(self):
        print("NOUS AGENT")
        self.emitter = EventEmitter()

    async def handleInput(self, user_input):
        try:
            inputs = {
                "input": user_input,
                "loop_idx": 0,
                "selected_entity": semantic_model.selectedEntity,
                "messages": [],
                "answer": None,
                "cut_to_final": False
            }

            fa = ""
            chat_messages = []

            print("///////////////////// INPUT /////////////////////")

            config = {"configurable": {"thread_id": str(uuid.uuid4())}}

            async for output in app.astream(inputs, config):
                print("///////////////////// OUTPUT /////////////////////")
                print(output)
                for key, value in output.items():
                    for message in value.get("messages", []):
                        if isinstance(message, dict):
                            chat_messages.append(message)
                            if key == NODE_FINAL_ANSWER:
                                self.emitter.emit('final_answer', message)
                                fa = message["content"]
                        else:
                            print(f"Unexpected message format: {message}")

                    self.emitter.emit('chatHistory', chat_messages)

            return fa

        except Exception as e:
            print("An error occurred:", str(e))
            print("Full error:", e)  # Add full error info
            error_message = {'role': 'assistant', 'content': f'Error: {str(e)}'}
            self.emitter.emit('final_answer', error_message)

nousAgent = NOUSAgent()
