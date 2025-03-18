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
# from src.relica_nous_langchain.agent.Tools import (
#     converted_tools,
#     tool_descriptions,
#     tool_names,
#     )
from src.relica_nous_langchain.SemanticModel import semantic_model


################################################################################## FINAL ANSWER


# final_answer_llm = ChatOpenAI(
#     model=openAIModel,
#     temperature=0,
#     max_tokens=1000,
#     timeout=None,
#     max_retries=2,
#     stop=['\nObservation',
#           '\nFinal Answer',
#           '\nThought',
#           '\nAction'],
#     )


final_answer_llm = ChatAnthropic(
    model=anthropicModel,
    temperature=0,
    max_tokens=1000,
    timeout=None,
    max_retries=2,
    stop=['\nObservation',
          '\nFinal Answer',
          '\nThought',
          '\nAction'],
    )

def final_answer(state):
    input = state['input']
    messages = state['messages']
    messages_str = "\n".join([msg["content"] for msg in messages])

    prompt = FULL_TEMPLATES["final_answer"].format(
        curr_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        semantic_model=semantic_model.getModelRepresentation(semantic_model.selectedEntity),
        context=semantic_model.context,
        agent_scratchpad=messages_str,
        chat_history=format_chat_history(state['messages'])  # Use state instead of memory
    )

    response = final_answer_llm.invoke([("system", prompt + '\nFinal Answer: '), ("human", input)])

    print("/////////////////// FINAL ANSWER /////////////////////")

    message = response.content

    # memory.save_context(
    #     {"input": state['input']},
    #     {"output": message}
    # )

    return {
        "messages": [{"role": "assistant", "content": f"Final Answer: {message}"}],
        "answer": message
    }
