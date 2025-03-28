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
from src.relica_nous_langchain.agent.Tools import (
    converted_tools,
    tool_descriptions,
    tool_names,
    )

# from src.relica_nous_langchain.services.CCComms import ccComms
from src.relica_nous_langchain.SemanticModel import semantic_model

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


def thought(state):
    loop_idx = state.get('loop_idx', 0) + 1
    messages = state['messages']
    input = state['input']
    scratchpad = state['scratchpad']

    if loop_idx > MAX_ITERATIONS:
        return {
            "scratchpad": state.get('scratchpad', '') + f"\n\n!!!ATTENTION!!! : Reached maximum iteration limit ({MAX_ITERATIONS}). Moving to final answer.",
            "loop_idx": loop_idx,
            # "cut_to_final": True
            "next_step": ACTION_FINAL_ANSWER
        }

    prompt = FULL_TEMPLATES["thought"].format(
        curr_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        background_info=background_info,
        # semantic_model=semanticModel.getModelRepresentation(ccComms.selectedEntity),
        # semantic_model=semantic_model.format_relationships(),
        # context=semantic_model.context,
        environment=semantic_model.format_relationships(),
        selected_entity=semantic_model.selectedEntity,
        tools=converted_tools,
        tool_descriptions=tool_descriptions,
        tool_names=tool_names,
        agent_scratchpad=scratchpad,
        chat_history=format_chat_history(messages)  # Use state instead of memory
    )

    print("/////////////////// THOUGHT BEGIN /////////////////////")

    # response = thought_llm.invoke([("system", prompt),("human", input)])
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
    # print(response)
    print(chat_completion.choices[0].message.content)
    print("%~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    print(chat_completion.choices[0].message.reasoning)
    print("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
    message = chat_completion.choices[0].message.content #response.content
    # strip message of leading xml tags
    message = message.split("</thought>")[0].split("<thought>")[-1]

    new_scratchpad = scratchpad + f"<thought>\n{message}\n</thought>"

    # Check if thought suggests we have enough info for a final answer
    if "final answer" in message.lower() or "sufficient information" in message.lower() or "enough information" in message.lower():
        return {
            "scratchpad": new_scratchpad,
            "thought": message,
            "loop_idx": loop_idx,
            "next_step": ACTION_FINAL_ANSWER
        }

    # Otherwise, move to action step
    return {
        "scratchpad": new_scratchpad,
        "thought": message,
        "loop_idx": loop_idx,
        "next_step": ACTION_ACT
    }

    # return {
    #     "scratchpad": scratchpad + f"\n{message} + </thought>",
    #     # "messages": [{"role": "assistant", "content": f"Thought: {message}"}],
    #     "loop_idx": loop_idx
    # }
