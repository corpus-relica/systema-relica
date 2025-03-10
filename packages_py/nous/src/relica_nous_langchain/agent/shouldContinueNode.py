#!/usr/bin/env python3

from datetime import datetime
# from langchain_openai import  ChatOpenAI
from langchain_anthropic import ChatAnthropic

from src.relica_nous_langchain.agent.Common import (
    # openAIModel,
    anthropicModel,
    )
from src.relica_nous_langchain.agent.Common import (
    ACTION_CONTINUE,
    ACTION_FINAL_ANSWER,
)

from pydantic import BaseModel, Field, StrictInt


isCompleteTemplate = """Answer only yes or no: Does the following statement indicate that a task needs to be completed or that some work is required?: \"{input}\""""

class ShouldContinueResponse(BaseModel):
    should_continue: str = Field(..., enum=["yes", "no"])

# should_continue_llm = ChatOpenAI(
#     model="gpt-4o",
#     temperature=0,
#     max_tokens=1000,
#     timeout=None,
#     max_retries=2,
#     stop=['<\\s>'],
#     ).with_structured_output(ShouldContinueResponse)

should_continue_llm = ChatAnthropic(
    model=anthropicModel,
    temperature=0,
    max_tokens=1000,
    timeout=None,
    max_retries=2,
    stop=['<\\s>'],
    ).with_structured_output(ShouldContinueResponse)

# Define the function that determines whether to continue or not
def should_continue(state):
    print("/////////////////// SHOULD CONTINUE /////////////////////")

    messages = state['messages']
    input = state['input']

    last_message = messages[-1]
    #last_message is everything after the first colon
    last_message = last_message[last_message.find(":")+1:].strip()

    #check does last_message contain "final answer"
    if "final answer" in last_message: return ACTION_FINAL_ANSWER
    if "terminate" in last_message: return ACTION_FINAL_ANSWER
    if last_message == "": return ACTION_FINAL_ANSWER

    prompt = isCompleteTemplate.format(
        input=last_message,
    )

    response = should_continue_llm.invoke([("system",  prompt), ("human", input)])

    message = response.should_continue

    if message == "no":
        return ACTION_FINAL_ANSWER
    else:
        return ACTION_CONTINUE
