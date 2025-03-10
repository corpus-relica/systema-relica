#!/usr/bin/env python3

from src.relica_nous_langchain.agent.Common import (
    ACTION_CONTINUE,
    ACTION_FINAL_ANSWER,
)

def should_cut_to_the_chase(state):
    # First check loop count
    if state['loop_idx'] >= 3:  # Or whatever max you want
        print("Hit maximum loop count, cutting to final answer")
        return ACTION_FINAL_ANSWER

    messages = state['messages']
    last_message = messages[-1]["content"]

    # check does last message start with "Thought"
    if last_message.startswith("Thought"):
        # is the end of last message "I now know the final answer"
        if last_message.endswith("I now know the final answer"):
            return ACTION_FINAL_ANSWER
        else:
            return ACTION_CONTINUE  # Changed this! Was returning FINAL_ANSWER on any thought
    else:
        return ACTION_CONTINUE
