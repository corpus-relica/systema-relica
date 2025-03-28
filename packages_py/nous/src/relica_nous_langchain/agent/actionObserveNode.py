#!/usr/bin/env python3
from datetime import datetime
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import ToolNode
from langchain_core.messages import AIMessage

#
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
#

from src.relica_nous_langchain.agent.Common import (
    localModel,
    openAIModel,
    anthropicModel,
    format_chat_history,
    ACTION_FINAL_ANSWER,
    ACTION_CONTINUE,
    ACTION_THINK,
    ACTION_ACT,
    )
from src.relica_nous_langchain.agent.Templates import (background_info,
                                                       FULL_TEMPLATES)
from src.relica_nous_langchain.agent.Tools import (
    converted_tools,
    tool_descriptions,
    tool_names,
    tools,
    )

# from src.relica_nous_langchain.services.CCComms import ccComms
from src.relica_nous_langchain.SemanticModel import semantic_model

# Create a ToolNode instance with your tools
tool_node = ToolNode(tools)

# Set up the model with tools
# action_llm = ChatAnthropic(
#     model=anthropicModel,
#     temperature=0.7,
#     max_tokens=500,
#     timeout=None,
#     max_retries=2,
#     stop=['\nObservation',
#           '\nFinal Answer',
#           '\nThought',
#           '\nAction']
#     ).bind_tools(converted_tools)

# action_llm = ChatOpenAI(
#     model=openAIModel,
#     # temperature=0.6,
#     # base_url="http://127.0.0.1:1234/v1",
#     # openai_api_key="dummy_value",
#     # model_name=localModel,
#     max_tokens=1000,
#     timeout=None,
#     max_retries=2,
#     stop=['\nObservation',
#           '\nFinal Answer',
#           '\nThought',
#           '\nAction']
#     ).bind_tools(tools)

# action_llm = ChatOpenAI(
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
#           '\nAction']
#     ).bind_tools(tools)

action_llm = ChatGroq(
    model_name="qwen-qwq-32b",
    temperature=0.7,
    max_tokens=1000,
    timeout=None,
    max_retries=2,
    stop=['\nObservation',
          '\nFinal Answer',
          '\nThought',
          '\nAction']
    ).bind_tools(converted_tools)

async def action_observe(state):

    input = state['input']
    scratchpad = state['scratchpad']
    messages = state['messages']
    loop_idx = state.get('loop_idx', 1)

    prompt = FULL_TEMPLATES["action"].format(
        curr_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        background_info=background_info,
        # semantic_model=semantic_model.getModelRepresentation(semantic_model.selectedEntity),
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

    print("/////////////////// ACTION BEGIN /////////////////////")

    # Invoke the model with the prompt
    response = action_llm.invoke([("system", prompt), ("human", input)])

    # strip everything between and including '<think>' and '</think>'
    # foobar = response.content.split("</think>")[-1]

    print("/////////////////// ACTION RESPONSE START /////////////////////")
    # print("ACTION REPONSE -->", foobar)

    # Initialize variables
    final_answer = None

    # Check for tool calls first (these take precedence)
    has_tool_calls = hasattr(response, 'tool_calls') and response.tool_calls

    # Special handling for cutToFinalAnswer tool
    if has_tool_calls:
        for tool_call in response.tool_calls:
            if tool_call["name"] == "cutToFinalAnswer":
                # Extract the message from the tool call
                final_answer = tool_call["args"].get("message", "I'm here to help!")
                break

    # Check content for final answer
    if isinstance(response.content, list):
        # Look for final answer in content
        for chunk in response.content:
            if isinstance(chunk, dict) and chunk.get('type') == 'text':
                text = chunk.get('text', '')

                # Look for final answer if not already set by tool call
                if not final_answer and 'FINAL_ANSWER:' in text:
                    final_answer = text.split('FINAL_ANSWER:')[1].strip()
    else:
        # Handle as a string (fallback)
        text_content = str(response.content)

        # Look for final answer if not already set by tool call
        if not final_answer and 'FINAL_ANSWER:' in text_content:
            final_answer = text_content.split('FINAL_ANSWER:')[1].strip()

    # Check if we have a final answer
    if final_answer:
        # Clean up the output to ensure consistent formatting
        final_answer = final_answer.strip()
        return {
            "scratchpad": scratchpad + f"\n\n<FinalAnswer>{final_answer}</FinalAnswer>",
            "loop_idx": loop_idx,
            "cut_to_final": True,
            "answer": final_answer,
            "next_step": ACTION_FINAL_ANSWER
        }

    print("/////////////////// ACTION/OBSERVE AGENT TOOL CALLS /////////////////////")
    print(response.tool_calls if has_tool_calls else "No tool calls")

    # Handle regular tool calls if present (not cutToFinalAnswer)
    if has_tool_calls:
        # Get the first tool call that isn't cutToFinalAnswer
        for tool_call in response.tool_calls:
            if tool_call["name"] != "cutToFinalAnswer":
                action_name = tool_call["name"]
                action_arguments = tool_call["args"]

                # Execute the tool
                ai_message = AIMessage(
                    content="",
                    tool_calls=[
                        {
                            "name": action_name,
                            "args": action_arguments,
                            "id": tool_call.get("id", "tool_call_id"),
                            "type": "tool_call",
                        }
                    ],
                )

                # Get the tool response
                tool_result = await tool_node.ainvoke({"messages": [ai_message]})
                tool_messages = tool_result.get("messages", [])
                tool_response = tool_messages[0].content if tool_messages else "No response from tool"

                # Update scratchpad with action and observation
                new_scratchpad = scratchpad + f"""
<Action>{action_name}</Action>
<ActionInput>{action_arguments}</ActionInput>
<Observation>\n{tool_response}\n</Observation>
"""

                return {
                    "scratchpad": new_scratchpad,
                    "loop_idx": loop_idx,
                    "next_step": ACTION_THINK
                }

    # Fallback if no tool calls or final answer is detected
    return {
        "scratchpad": scratchpad + "\n\nNo clear action or final answer determined. Moving to next step",
        "loop_idx": loop_idx,
        "next_step": ACTION_FINAL_ANSWER,
        "cut_to_final": True,
        # "answer": "I'm not sure how to proceed with this request. Could you provide more information or clarify what you're looking for?"
    }
