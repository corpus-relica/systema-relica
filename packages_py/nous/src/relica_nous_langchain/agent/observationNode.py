#!/usr/bin/env python3

from datetime import datetime
from langchain_openai import  ChatOpenAI
from langchain_anthropic import ChatAnthropic

from src.relica_nous_langchain.agent.Common import (
    openAIModel,
    format_chat_history,
    )
from src.relica_nous_langchain.agent.Templates import FULL_TEMPLATES
from src.relica_nous_langchain.services.CCComms import ccComms
from src.relica_nous_langchain.SemanticModel import semanticModel


################################################################################## OBSERVATION


# Configure LLM for observations
observation_llm = ChatOpenAI(
    model=openAIModel,
    temperature=0,
    max_tokens=1000,
    timeout=None,
    max_retries=2,
    stop=['\nThought:', '\nAction:', '\nFinal Answer:']
)

async def observation(state):
    loop_idx = state['loop_idx']  # Get current loop count

    print("/////////////////// OBSERVATION BEGIN /////////////////////")

    if state.get("cut_to_final"):
        return {
            "messages": [
                {"role": "assistant", "content": "Observation: I have enough information to answer the question without additional tool use. I will cut to the chase"},
                {"role": "assistant", "content": "Thought: I now know the final answer"}
            ],
            "loop_idx": loop_idx  # Pass it along
        }

    messages = state['messages']
    messages_str = "\n".join([msg["content"] for msg in messages])
    input = state['input']

    # Build the observation prompt
    prompt = FULL_TEMPLATES["observation"].format(
        curr_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        semantic_model=semanticModel.getModelRepresentation(ccComms.selectedEntity),
        context=semanticModel.context,
        agent_scratchpad=messages_str,
        # action_name=action_name,
        # action_arguments=json.dumps(action_arguments, indent=2),
        # tool_descriptions=tool_descriptions,
        # tool_response=tool_response,
        chat_history=format_chat_history(state['messages'])  # Use state instead of memory
    )

    # Get LLM interpretation of the observation
    observation_response = observation_llm.invoke([("system", prompt), ("human", input)])
    interpreted_observation = observation_response.content

    return {
        "messages": [{"role": "assistant", "content": f"Observation: {interpreted_observation}"}],
        "loop_idx": loop_idx  # Pass it along
    }
