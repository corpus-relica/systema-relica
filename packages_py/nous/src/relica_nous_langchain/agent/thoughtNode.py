#!/usr/bin/env python3
import os

from groq import Groq

from datetime import datetime
from langchain_openai import  ChatOpenAI
from langchain_anthropic import ChatAnthropic

#
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
#

from src.relica_nous_langchain.agent.Common import (
    localModel,
    anthropicModel,
    openAIModel,
    format_chat_history,
    ACTION_FINAL_ANSWER,
    ACTION_ACT,
    )

from src.relica_nous_langchain.agent.Templates import (background_info,
                                                       FULL_TEMPLATES)

from src.relica_nous_langchain.services.aperture_client import ApertureClientProxy 

################################################################################## THOUGHT

# thought_llm = ChatAnthropic(
#     model=anthropicModel,
#     temperature=0.7,
#     max_tokens=500,
#     timeout=None,
#     max_retries=2,
#     stop=['</thought>\n'],
#           # 'Final Answer:',
#           # '\nFinal Answer',
#           # '\n Final Answer',],
#     )

# thought_llm = ChatGroq(
#     model_name="qwen-qwq-32b",
#     temperature=0.7,
#     max_tokens=2000,
#     timeout=None,
#     max_retries=2,
#     stop=['</thought',
#           '</though',
#           '</thoug',
#           '</thou'],
#           # 'Final Answer:',
#           # '\nFinal Answer',
#           # '\n Final Answer',],
#     )

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)


# chat = ChatGroq(temperature=0, model_name="llama-3.3-70b-versatile")
# system = "You are a helpful assistant."
# human = "{text}"
# prompt = ChatPromptTemplate.from_messages([("system", system), ("human", human)])

# chain = prompt | chat
# presidential = chain.invoke({"text": "Explain the importance of low latency LLMs."})

# print("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
# print(presidential.content)
# print("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")

# thought_llm = ChatOpenAI(
#     model=openAIModel,
#     # temperature=0.6,
#     # base_url="http://127.0.0.1:1234/v1",
#     # openai_api_key="dummy_value",
#     # model_name=localModel,
#     max_tokens=1000,
#     timeout=None,
#     max_retries=2,
#     stop=['</thought>\n'],
#           # 'Final Answer:',
#           # '\nFinal Answer',
#           # '\n Final Answer',],
#     )

MAX_ITERATIONS = 4


def thought(state, aperture_client: ApertureClientProxy, semantic_model, tools, converted_tools, tool_descriptions, tool_names):
    """Generates the thought process for the agent, deciding the next step."""
    loop_idx = state.get('loop_idx', 0) + 1
    user_id = state.get("user_id", "default_user") 
    env_id = state.get("env_id", "default_env") 
    messages = state['messages']
    input = state['input']
    scratchpad = state['scratchpad']

    if loop_idx > MAX_ITERATIONS:
        message = "Loop limit exceeded. Terminating."
        # Optionally, format as a final answer structure if needed
        return { 
            "messages": state["messages"] + [("assistant", message)],
            "scratchpad": state["scratchpad"] + f"\nLoop limit reached. Forcing final answer.",
            "thought": message, # Ensure this signals termination to should_continue/final_answer
            "next_step": ACTION_FINAL_ANSWER,
            "cut_to_final": True,
            "loop_idx": loop_idx,
            "answer": message, # Provide the termination message as the answer
            "user_id": user_id, # Propagate user_id
            "env_id": env_id    # Propagate env_id
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
        chat_history=format_chat_history(messages)  # Use state instead of memory
    )

    print("/////////////////// THOUGHT BEGIN /////////////////////")

    chat_completion = client.chat.completions.create(
        model="qwen-qwq-32b",
        messages=[
            {
                "role": "system",
                "content": prompt,
                },
            {
                "role": "user",
                "content": input,
                }
            ],
        temperature=0.7,
        reasoning_format="parsed",
        stop=['</thought>'],
        )

    print("/////////////////// THOUGHT COMPLETE /////////////////////")
    print("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
    print(chat_completion.choices[0].message.content)
    print("%~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    print(chat_completion.choices[0].message.reasoning)
    print("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
    message = chat_completion.choices[0].message.content 
    message = message.split("</thought>")[0].split("<thought>")[-1]

    new_scratchpad = scratchpad + f"<thought>\n{message}\n</thought>"

    if "final answer" in message.lower() or "sufficient information" in message.lower() or "enough information" in message.lower():
        return {
            "scratchpad": new_scratchpad,
            "thought": message,
            "loop_idx": loop_idx,
            "next_step": ACTION_FINAL_ANSWER,
            "user_id": user_id, # Propagate user_id
            "env_id": env_id    # Propagate env_id
        }

    return {
        "scratchpad": new_scratchpad,
        "thought": message,
        "loop_idx": loop_idx,
        "next_step": ACTION_ACT,
        "user_id": user_id, # Propagate user_id
        "env_id": env_id    # Propagate env_id
    }
