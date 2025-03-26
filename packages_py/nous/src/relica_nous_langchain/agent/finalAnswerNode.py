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
# from src.relica_nous_langchain.agent.reactAgentNode import format_conversation_for_prompt


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
    temperature=0.7,
    max_tokens=1000,
    timeout=None,
    max_retries=2,
    stop=['\nObservation',
          '\nFinal Answer',
          '\nThought',
          '\nAction'],
    )

def final_answer(state):
    """
    Generate the final answer to the user's query.
    
    If the state already has an answer from the react_agent, use it.
    Otherwise, generate a final answer based on all previous interactions.
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
        print(message)

    # Return just the message content
    return {
        "answer": message
    }
