#!/usr/bin/env python3

def react(state):
    message = 'Question: ' + state['input']
    return {"messages": [{"role": "user", "content": message}]}  # Return dict instead of string
