#!/usr/bin/env python3
import os
from datetime import datetime

from rich import print
from rich.console import Console

console = Console()

from groq import Groq
import instructor
from pydantic import BaseModel
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
client = instructor.from_groq(client)

class User(BaseModel):
    name: str
    age: int

class ThoughtResponse(BaseModel):
    thought: str
    cutToFinalAnswer: bool
    finalAnswer: str


# Create structured output
user = client.chat.completions.create(
    model="mistral-saba-24b",
    messages=[
        {"role": "user", "content": "Extract: Jason is 25 years old"},
    ],
    response_model=User,
)

console.print(user)

from src.relica_nous_langchain.agent.config import (
    ACTION_FINAL_ANSWER,
    ACTION_ACT,
    format_chat_history,
)

from src.relica_nous_langchain.agent.Templates import (
    background_info,
    FULL_TEMPLATES
)

from src.relica_nous_langchain.services.aperture_client import ApertureClientProxy
from src.relica_nous_langchain.agent.config import DEFAULT_CONFIG, get_model_instance

def thought(state, aperture_client: ApertureClientProxy, semantic_model, tools, converted_tools, tool_descriptions, tool_names):
    """Generates the thought process for the agent, deciding the next step."""
    loop_idx = state.get('loop_idx', 0) + 1
    user_id = state.get("user_id", "default_user") 
    env_id = state.get("env_id", "default_env") 
    messages = state['messages']
    input = state['input']
    scratchpad = state['scratchpad']

    if loop_idx > DEFAULT_CONFIG.max_iterations:
        message = "Loop limit reached. I better summarize what I know for the final answer..."
        return { 
            # "messages": [("assistant", message)],
            "scratchpad": state["scratchpad"] + f"\n<thought>Loop limit reached. I better summarize what I know for the final answer...</thought>",
            "thought": message,
            "next_step": ACTION_FINAL_ANSWER,
            "cut_to_final": True,
            "loop_idx": loop_idx,
            # "answer": message,
            "user_id": user_id,
            "env_id": env_id
        }

    prompt = FULL_TEMPLATES["thought"].format(
        user_id=user_id,
        env_id=env_id,
        curr_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        background_info=background_info,
        environment=semantic_model.format_relationships(),
        selected_entity=semantic_model.selectedEntity,
        tools=tools,
        tool_descriptions=tool_descriptions,
        tool_names=tool_names,
        agent_scratchpad=scratchpad,
        chat_history=format_chat_history(messages),
        input=input
    )

    console.print("/////////////////// THOUGHT BEGIN /////////////////////", style="bold red")

    # Get the model instance from configuration
    thought_model = get_model_instance(DEFAULT_CONFIG.thought_model)
    
    chat_completion = thought_model.invoke([
        {
            "role": "system",
            "content": prompt,
        },
        {
            "role": "user",
            "content": input,
        }
    ])

    print("/////////////////// THOUGHT COMPLETE /////////////////////")
    print("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
    print(chat_completion.content)
    print("%~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    # console.print(chat_completion_too)
    if hasattr(chat_completion, 'reasoning'):
        print(chat_completion.reasoning)
    print("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
    
    message = chat_completion.content 
    message = message.split("</thought>")[0].split("<thought>")[-1]
    message = message.strip()

    new_scratchpad = scratchpad + f"<thought>\n{message}\n</thought>"

    if "final answer" in message.lower() or "sufficient information" in message.lower() or "enough information" in message.lower():
        return {
            "scratchpad": new_scratchpad,
            "thought": message,
            "loop_idx": loop_idx,
            "next_step": ACTION_FINAL_ANSWER,
            "user_id": user_id,
            "env_id": env_id
        }

    return {
        "scratchpad": new_scratchpad,
        "thought": message,
        "loop_idx": loop_idx,
        "next_step": ACTION_ACT,
        "user_id": user_id,
        "env_id": env_id
    }
