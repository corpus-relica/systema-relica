#!/usr/bin/env python3

from datetime import datetime
from langchain_openai import  ChatOpenAI
from langchain_anthropic import ChatAnthropic

from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from src.relica_nous_langchain.agent.Common import (
    openAIModel,
    localModel,
    anthropicModel,
    format_chat_history,
    )
from src.relica_nous_langchain.agent.Templates import FULL_TEMPLATES
from src.relica_nous_langchain.SemanticModel import semantic_model
from src.relica_nous_langchain.services.aperture_client import ApertureClientProxy # Not strictly needed here

################################################################################## FINAL ANSWER


final_answer_llm = ChatGroq(
    model_name="qwen-qwq-32b",
    temperature=0.7,
    max_tokens=1000,
    timeout=None,
    max_retries=2,
    stop=['\nObservation',
          '\nFinal Answer',
          '\nThought',
          '\nAction'],
    )
# final_answer_llm = ChatOpenAI(
#     model=openAIModel,
#     # temperature=0,
#     max_tokens=1000,
#     timeout=None,
#     max_retries=2,
#     stop=['\nObservation',
#           '\nFinal Answer',
#           '\nThought',
#           '\nAction'],
#     )

# final_answer_llm = ChatOpenAI(
#     # model=openAIModel,
#     temperature=0,
#     base_url="http://127.0.0.1:1234/v1",
#     openai_api_key="dummy_value",
#     model_name=localModel,
#     max_tokens=1000,
#     timeout=None,
#     max_retries=2,
#     stop=['\nObservation',
#           '\nFinal Answer',
#           '\nThought',
#           '\nAction'],
#     )

# final_answer_llm = ChatAnthropic(
#     model=anthropicModel,
#     temperature=0.7,
#     max_tokens=1000,
#     timeout=None,
#     max_retries=2,
#     stop=['\nObservation',
#           '\nFinal Answer',
#           '\nThought',
#           '\nAction'],
#     )

def final_answer(state, semantic_model):
    """
    Generate the final answer to the user's query.

    If the state already has an answer (e.g., from loop limit or specific tool call), use it.
    Otherwise, generate a final answer based on all previous interactions using the LLM.
    """
    print("/////////////////// FINAL ANSWER NODE BEGIN /////////////////////")
    
    input_text = state['input']
    scratchpad = state['scratchpad']

    # If we already have an answer from the reactAgent, use it directly
    if state.get('answer'):
        message = state['answer']
        print("/////////////////// USING EXISTING FINAL ANSWER /////////////////////")
        print(message)
    else:
        # Generate a final answer using the LLM
        prompt = f"""You are NOUS (Network for Ontological Understanding and Synthesis), an AI assistant.

Current Date and Time: {datetime.now().strftime("%Y-%m-%d %H:%M")}

Currently loaded semantic model:
{semantic_model.getModelRepresentation(semantic_model.selectedEntity)}

Current question:
{input_text}

scratchpad:
{scratchpad}

Based on the conversation history and the current question, provide a final, comprehensive answer.
"""

        response = final_answer_llm.invoke([("system", prompt), ("human", input_text)])


        print("/////////////////// GENERATED FINAL ANSWER /////////////////////")
        message = response.content
        # strip everything before '</think>'
        message = message.split("</think>")[-1]
        print(message)

    # Return the final answer in the state dictionary
    return {"answer": message}
