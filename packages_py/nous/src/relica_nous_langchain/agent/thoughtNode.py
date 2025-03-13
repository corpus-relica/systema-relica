#!/usr/bin/env python3

from datetime import datetime
# from langchain_openai import  ChatOpenAI
from langchain_anthropic import ChatAnthropic

from src.relica_nous_langchain.agent.Common import (
    # openAIModel,
    anthropicModel,
    format_chat_history,
    )
from src.relica_nous_langchain.agent.Templates import FULL_TEMPLATES
from src.relica_nous_langchain.agent.Tools import (
    converted_tools,
    tool_descriptions,
    tool_names,
    )

# from src.relica_nous_langchain.services.CCComms import ccComms

from src.relica_nous_langchain.SemanticModel import semanticModel


################################################################################## THOUGHT

# thought_llm = ChatOpenAI(
#     model=openAIModel,
#     temperature=0,
#     max_tokens=1000,
#     timeout=None,
#     max_retries=2,
#     stop=['\n\n',
#           'Final Answer:',
#           '\nFinal Answer',
#           '\n Final Answer',],
#     )

thought_llm = ChatAnthropic(
    model=anthropicModel,
    temperature=0,
    max_tokens=1000,
    timeout=None,
    max_retries=2,
    stop=['</thought>'],
          # 'Final Answer:',
          # '\nFinal Answer',
          # '\n Final Answer',],
    )

def thought(state):
    loop_idx = state['loop_idx'] + 1
    messages = state['messages']
    messages_str = "\n".join([msg["content"] for msg in messages])
    input = state['input']

    prompt = FULL_TEMPLATES["thought"].format(
        curr_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        # semantic_model=semanticModel.getModelRepresentation(ccComms.selectedEntity),
        semantic_model=semanticModel.getModelRepresentation(None),
        context=semanticModel.context,
        tools=converted_tools,
        tool_descriptions=tool_descriptions,
        tool_names=tool_names,
        agent_scratchpad=messages_str,
        chat_history=format_chat_history(state['messages'])  # Use state instead of memory
    )

    print("/////////////////// THOUGHT BEGIN /////////////////////")

    response = thought_llm.invoke([("system", prompt),("human", input)])

    print("/////////////////// THOUGHT COMPLETE /////////////////////")
    message = response.content

    return {
        "messages": [{"role": "assistant", "content": f"Thought: {message}"}],
        "loop_idx": loop_idx
    }
