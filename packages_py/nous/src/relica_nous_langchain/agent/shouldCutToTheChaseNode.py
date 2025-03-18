#!/usr/bin/env python3

from src.relica_nous_langchain.agent.Common import (
    ACTION_CONTINUE,
    ACTION_FINAL_ANSWER,
)

def should_cut_to_the_chase(state):
    """This function is kept for compatibility but is no longer used in the main workflow.
    The logic is now in reactAgentNode.py's should_continue_or_finish function."""
    return ACTION_FINAL_ANSWER if state.get("cut_to_final", False) else ACTION_CONTINUE
