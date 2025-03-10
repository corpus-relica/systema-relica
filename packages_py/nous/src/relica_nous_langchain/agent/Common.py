#!/usr/bin/env python3


openAIModel="gpt-4o-mini"
anthropicModel = "claude-3-opus-20240229"

def format_chat_history(messages):
    formatted = ""
    for msg in messages:
        formatted += f"{msg['role']}: {msg['content']}\n"
    return formatted

NODE_REACT = "ReAct"
NODE_THOUGHT = "thought"
NODE_ACTION = "action"
NODE_OBSERVATION = "observation"
NODE_FINAL_ANSWER = "final_answer"
NODE_COULDNT_ANSWER = "couldnt_answer"

ACTION_CONTINUE = "continue"
ACTION_FINAL_ANSWER = "final_answer"
ACTION_MAX_LOOPS = "max_loops"
