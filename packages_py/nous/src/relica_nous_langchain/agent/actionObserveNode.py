#!/usr/bin/env python3o
import os

# from groq import Groq
from langchain_groq import ChatGroq

from datetime import datetime
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

from langgraph.prebuilt import ToolNode
from langchain_core.messages import AIMessage

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
from src.relica_nous_langchain.agent.Templates import (background_info, FULL_TEMPLATES)
from src.relica_nous_langchain.services.aperture_client import ApertureClientProxy

# client = Groq(
#     api_key=os.environ.get("GROQ_API_KEY"),
# )

async def action_observe(state, aperture_client: ApertureClientProxy, semantic_model, tools, converted_tools, tool_descriptions, tool_names):
    """Invokes the LLM to decide on an action, executes the tool, and updates the state."""
    
    user_id = state['user_id']
    # Access env_id directly, assuming it's now reliably propagated
    print("Accessing env_id from state:", state)
    env_id = state['env_id']

    input = state['input']
    scratchpad = state['scratchpad']
    messages = state['messages']
    loop_idx = state.get('loop_idx', 1)

    prompt = FULL_TEMPLATES["action"].format(
        user_id=user_id,
        env_id=env_id,

        curr_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        background_info=background_info,
        environment=semantic_model.format_relationships(),
        selected_entity=semantic_model.selectedEntity,
        tools=converted_tools,
        tool_descriptions=tool_descriptions,
        tool_names=tool_names,
        agent_scratchpad=scratchpad,
        chat_history=format_chat_history(messages)  # Use state instead of memory
    )

    print("/////////////////// ACTION BEGIN /////////////////////")

    # Set up the action LLM with the *specific* tools for this instance
    # Note: LLM instantiation might ideally happen once in NOUSAgent.__init__
    # and passed here, but for now, we create it here with bound tools.
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
    ).bind_tools(tools) # Use the passed-in tools list

    # Create a ToolNode instance with the passed-in tools
    # This ToolNode is used specifically for executing the chosen tool later
    tool_node = ToolNode(tools)

    print("/////////////////// ACTION OBSERVE BEGIN /////////////////////")

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
            "next_step": ACTION_FINAL_ANSWER,
            "user_id": user_id, # Propagate user_id
            "env_id": env_id    # Propagate env_id
        }

    print("/////////////////// ACTION/OBSERVE AGENT TOOL CALLS /////////////////////")
    print(response.tool_calls if has_tool_calls else "No tool calls")

    # Handle regular tool calls if present (not cutToFinalAnswer)
    if has_tool_calls:
        # Important: Pass the AIMessage with tool_calls directly to tool_node
        print(f"Input to tool_node.ainvoke: Type={type(response)}, Content={response}") # Debug

        # Extract the tool_calls list from the AIMessage
        extracted_tool_calls = response.tool_calls
        print(f"Extracted tool_calls: {extracted_tool_calls}") # Debug

        scratchpad += f"\n<Action>"
        scratchpad += f"\n<ActionName>{extracted_tool_calls[0]['name']}</ActionName>"
        scratchpad += f"\n<ActionArgs>"
        for arg in extracted_tool_calls[0]['args']:
            scratchpad += f"\n<Arg>{arg}: {extracted_tool_calls[0]['args'][arg]}</Arg>"
        scratchpad += "\n</ActionArgs>"
        scratchpad += f"\n</Action>"

        # Pass the extracted list of tool calls directly to ToolNode
        tool_messages = await tool_node.ainvoke(extracted_tool_calls)

        print("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
        print(tool_messages)
        print("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")

        return {
            "messages": messages, # + [response] + tool_messages['messages'],
            "scratchpad": scratchpad + f"\n<Observation>\n{response.content}\n</Observation>", # Observation is added via messages
            "next_step": ACTION_THINK, # Always return to thought after action/observation
            "user_id": user_id, # Propagate user_id
            "env_id": env_id    # Propagate env_id
        }

    # Fallback if no tool calls or final answer is detected
    return {
        "scratchpad": scratchpad + "\n\nNo clear action or final answer determined. Moving to next step",
        "loop_idx": loop_idx,
        "next_step": ACTION_FINAL_ANSWER,
        "cut_to_final": True,
        # "answer": "I'm not sure how to proceed with this request. Could you provide more information or clarify what you're looking for?",
        "user_id": user_id, # Propagate user_id
        "env_id": env_id    # Propagate env_id
    }
