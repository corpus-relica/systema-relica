#!/usr/bin/env python3

# Model configuration

# openAIModel="gpt-4o-mini"
openAIModel="o3-mini"

# anthropicModel = "claude-3-opus-20240229"
anthropicModel = "claude-3-7-sonnet-latest"
# anthropicModel = "claude-3-5-sonnet-latest"

# localModel = "gemma-3-12b-it"
localModel = "mistral-nemo-instruct-2407"

def format_chat_history(messages):
    """
    Format message history into a readable string, safely handling different
    message formats and types.
    """
    if not messages:
        return ""
        
    formatted = ""
    for msg in messages:
        # Handle different message formats safely
        if isinstance(msg, dict):
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            formatted += f"""<{role}>\n{content}\n</{role}>\n"""
        # elif isinstance(msg, str):
        #     formatted += f"""message: {msg}\n"""
        # else:
        #     # For any other type, convert to string safely
        #     formatted += f"""message: {str(msg)}\n"""

    return formatted

# Action types for graph flow control
ACTION_CONTINUE = "continue"
ACTION_FINAL_ANSWER = "final_answer"
ACTION_MAX_LOOPS = "max_loops"
ACTION_THINK = "think"
ACTION_ACT = "act"
