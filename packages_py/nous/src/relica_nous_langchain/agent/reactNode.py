#!/usr/bin/env python3

# This file is deprecated and only kept for compatibility
# The functionality has been moved to reactAgentNode.py

def react(state):
    """Legacy function - no longer used in main workflow.
    Functionality moved to react_agent in reactAgentNode.py"""
    message = 'Question: ' + state['input']
    return {"messages": [{"role": "user", "content": message}]}  # Return dict instead of string
