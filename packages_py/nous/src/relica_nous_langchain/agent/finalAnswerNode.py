#!/usr/bin/env python3

from rich import print
from rich.console import Console

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
from src.relica_nous_langchain.agent.config import DEFAULT_CONFIG, get_model_instance

################################################################################## FINAL ANSWER
console = Console()


def final_answer(state, semantic_model):
    """
    Generate the final answer to the user's query.

    If the state already has an answer (e.g., from loop limit or specific tool call), use it.
    Otherwise, generate a final answer based on all previous interactions using the LLM.
    """

    console.print("/////////////////// FINAL ANSWER NODE BEGIN /////////////////////", style="bold blue")
    
    input_text = state['input']
    scratchpad = state['scratchpad']

    # If we already have an answer from the reactAgent, use it directly
    if state.get('answer'):
        message = state['answer']
        console.print("/////////////////// USING EXISTING FINAL ANSWER /////////////////////", style="bold blue")
        console.print(message)
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

        # Get the model instance from configuration
        final_answer_model = get_model_instance(DEFAULT_CONFIG.final_answer_model)
        response = final_answer_model.invoke([("system", prompt), ("human", input_text)])

        console.print("/////////////////// GENERATED FINAL ANSWER /////////////////////", style="bold blue")
        message = response.content
        # strip everything before '</think>'
        message = message.split("</think>")[-1]
        console.print(message)

    # Return the final answer in the state dictionary
    return {"answer": message,
            "messages": [{"role": "assistant", "content":message}]}
