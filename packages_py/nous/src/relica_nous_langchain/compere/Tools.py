#!/usr/bin/env python3

from langchain.tools import tool
from src.relica_nous_langchain.SemanticModel import semanticModel
from src.relica_nous_langchain.services.CCComms import ccComms
from src.relica_nous_langchain.agent.NOUSAgent import nousAgent

import logging
import sys
import socketio

from dotenv import load_dotenv
load_dotenv()  # This loads the variables from .env
# from src.relica_nous_langchain.services.BrowserComms import browserComms
# from src.relica_nous_langchain.services.CCComms import ccComms
# from src.relica_nous_langchain.agent.NOUSAgent import nousAgent
# from src.relica_nous_langchain.SemanticModel import semanticModel
#

@tool
async def askAgent(input: str):
    """
    Ask the NOUS agent a question about the semantic model. Use this tool as the primary means to interact with the Semantic Model.
     Args:
        input (str): The input to ask the agent, should definitely be in the form of a question.
    """
    res = await nousAgent.handleInput(input)
    return res
    # return "NOUS Agent not yet implemented...sorry. DO NOT TRY AGAIN!"

@tool
async def cutToFinalAnswer(message: str)->str:
    """Invoke this to bypass ongoing dialogues and immediately supply the final, conclusive answer. It skips all intermediate conversation steps and allows to provide the direct outcome.
        Args:
            message: The final answer to the original input question
    """
    return "cut to the chase"
