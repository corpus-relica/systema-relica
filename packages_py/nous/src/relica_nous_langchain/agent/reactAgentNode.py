#!/usr/bin/env python3

from datetime import datetime
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import ToolNode
from langchain_core.messages import AIMessage

from src.relica_nous_langchain.agent.Common import (
    anthropicModel,
    format_chat_history,
    ACTION_FINAL_ANSWER,
    ACTION_CONTINUE,
    )
from src.relica_nous_langchain.agent.Tools import (
    converted_tools,
    tool_descriptions,
    tool_names,
    tools,
    )
from src.relica_nous_langchain.SemanticModel import semantic_model

# Maximum number of iterations to prevent infinite loops
MAX_ITERATIONS = 5

# Set up the tool node
tool_node = ToolNode(tools)

# Combined LLM for the React agent
react_llm = ChatAnthropic(
    model=anthropicModel,
    temperature=0,
    max_tokens=1500,
    timeout=None,
    max_retries=2,
).bind_tools(tools)

def format_conversation_for_prompt(messages):
    """
    Format the conversation history in a clear, readable format for the prompt.
    Only include actual user-assistant exchanges, not internal thought processes.
    """
    if not messages:
        return "No previous conversation."
        
    formatted = "Previous conversation:\n"
    for msg in messages:
        role = msg.get('role', 'unknown')
        content = msg.get('content', '')
        
        # Skip internal thought messages and only include clean user-assistant exchanges
        if role in ['user', 'assistant'] and not content.startswith("Thought:") and not content.startswith("Action:") and not content.startswith("Observation:"):
            # For assistant messages that start with "Final Answer:", clean them up
            if content.startswith("Final Answer:"):
                content = content.replace("Final Answer:", "").strip()
                
            formatted += f"{role}: {content}\n"
            
    return formatted

async def react_agent(state):
    print("/////////////////// REACT AGENT BEGIN /////////////////////")
    # Update loop counter
    loop_idx = state.get('loop_idx', 0) + 1
    
    # Check if we've exceeded the maximum number of iterations
    if loop_idx > MAX_ITERATIONS:
        return {
            "messages": [{"role": "assistant", "content": f"Reached maximum iteration limit ({MAX_ITERATIONS}). Moving to final answer."}],
            "loop_idx": loop_idx,
            "cut_to_final": True
        }
    
    # Get messages and input
    messages = state['messages']
    print(f"REACT: Received {len(messages)} messages in history")
    
    # The current user input is the last user message in the history
    input_text = state['input']  # This is still needed as the primary question
    
    # Create a clean conversation history for the prompt
    conversation_history = format_conversation_for_prompt(messages)
    
    # Create combined prompt for thought-action-observation
    prompt = f"""You are NOUS (Network for Ontological Understanding and Synthesis), an AI assistant.

Current Date and Time: {datetime.now().strftime("%Y-%m-%d %H:%M")}

Currently loaded semantic model:
{semantic_model.getModelRepresentation(semantic_model.selectedEntity)}

{conversation_history}

Current question: {input_text}

Follow the ReAct (Reasoning + Acting) process to answer the user's question:
1. Think about what information you need and how to get it.
2. Choose an appropriate tool to use.
3. Analyze the results and decide if you need more information or can provide a final answer.

Available tools:
{tool_descriptions}

You are on iteration {loop_idx} of {MAX_ITERATIONS} maximum iterations.

Format your response with:
<thought>Your step-by-step reasoning about the problem</thought>

Then, if you need more information, use one of the available tools.
If you have enough information to provide a final answer, respond with "FINAL_ANSWER: [your answer]"
"""

    # Make the LLM call for combined reasoning, action selection, and observation
    response = await react_llm.ainvoke([("system", prompt), ("human", input_text)])

    print("/////////////////// REACT AGENT RESPONSE TYPE /////////////////////")
    print(f"Response type: {type(response)}")
    print("Response content type:", type(response.content))
    
    print("/////////////////// REACT AGENT RESPONSE /////////////////////")
    print(response)
    
    # Handle the extraction of thought content correctly
    thought_content = ""
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
    
    # Handle the case where response.content is a list (Anthropic's format)
    if isinstance(response.content, list):
        # Look for text chunks with thought tags
        for chunk in response.content:
            if isinstance(chunk, dict) and chunk.get('type') == 'text':
                text = chunk.get('text', '')
                
                # Extract thought content if present
                if '<thought>' in text and '</thought>' in text:
                    thought_parts = text.split('</thought>')
                    thought_content = thought_parts[0].split('<thought>')[1].strip()
                
                # Look for final answer if not already set by tool call
                if not final_answer and 'FINAL_ANSWER:' in text:
                    final_answer = text.split('FINAL_ANSWER:')[1].strip()
    else:
        # Handle as a string (fallback)
        text_content = str(response.content)
        
        # Extract thought content
        if '<thought>' in text_content and '</thought>' in text_content:
            thought_parts = text_content.split('</thought>')
            thought_content = thought_parts[0].split('<thought>')[1].strip()
        
        # Look for final answer if not already set by tool call
        if not final_answer and 'FINAL_ANSWER:' in text_content:
            final_answer = text_content.split('FINAL_ANSWER:')[1].strip()
    
    # If no thought content was extracted, provide a fallback
    if not thought_content:
        thought_content = "Analyzing the query and determining the best response."
    
    new_messages = [{"role": "assistant", "content": f"Thought: {thought_content}"}]

    print("/////////////////// REACT AGENT THOUGHT /////////////////////")
    print(thought_content)

    # Check if we have a final answer from any method
    if final_answer:
        return {
            "messages": new_messages + [{"role": "assistant", "content": f"Final Answer: {final_answer}"}],
            "loop_idx": loop_idx,
            "cut_to_final": True,
            "answer": final_answer
        }

    print("/////////////////// REACT AGENT TOOL CALLS /////////////////////")
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
                
                return {
                    "messages": new_messages + [
                        {"role": "assistant", "content": f"Action: {action_name}"},
                        {"role": "assistant", "content": f"Action Input: {action_arguments}"},
                        {"role": "assistant", "content": f"Observation: {tool_response}"}
                    ],
                    "loop_idx": loop_idx,
                    "cut_to_final": False
                }
    
    # Fallback if no tool calls or final answer is detected
    return {
        "messages": new_messages + [{"role": "assistant", "content": "No clear action or final answer determined. Moving to next step."}],
        "loop_idx": loop_idx,
        "cut_to_final": True,  # Changed to true to avoid loops when no clear path
        "answer": "I'm not sure how to proceed with this request. Could you provide more information or clarify what you're looking for?"
    }

# Simple condition function to determine if we should continue or finish
def should_continue_or_finish(state):
    return ACTION_FINAL_ANSWER if state["cut_to_final"] else ACTION_CONTINUE
