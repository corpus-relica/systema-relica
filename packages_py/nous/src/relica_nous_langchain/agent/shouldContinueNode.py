#!/usr/bin/env python3
import os

import instructor
from groq import Groq
from langchain_groq import ChatGroq

from datetime import datetime

# from src.relica_nous_langchain.agent.Common import (
#     # openAIModel,
#     # anthropicModel,
#     )
from src.relica_nous_langchain.agent.Common import (
    ACTION_CONTINUE,
    ACTION_FINAL_ANSWER,
)

from pydantic import BaseModel, Field, StrictInt
from typing import Literal

isCompleteTemplate = """Answer only yes or no, Does the following statement indicate that a task is complete or that you should otherwise advance to the final answer stage:

\"{input}\"

in other words, 'yes' means you should skip to the final answer stage, and 'no' means you should continue with the current task.
"""

class ShouldContinueResponse(BaseModel):
    # reasoning: str = Field(
    #     ...,
    #     description="why you made the choice you did.",
    # )
    skip_to_answer: Literal["yes", "no"] = Field(..., description="whether to skip to the final answer(yes) stage or not(no).")

# should_continue_llm = ChatAnthropic(
#     model=anthropicModel,
#     temperature=0,
#     max_tokens=1000,
#     timeout=None,
#     max_retries=2,
#     stop=['<\\s>'],
#     ).with_structured_output(ShouldContinueResponse)

# should_continue_llm = ChatGroq(
#     model="qwen-qwq-32b",
#     temperature=0.7,
#     max_tokens=1000,
#     timeout=None,
#     max_retries=2,
#     stop=['<\\s>'],
#     ).with_structured_output(ShouldContinueResponse)

# client = Groq(
#     api_key=os.environ.get("GROQ_API_KEY"),
# )

client = instructor.from_groq(Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
))
# class ExtractUser(BaseModel):
#     name: str
#     age: int

# Define the function that determines whether to continue or not
def should_continue(state):
    # No external dependencies here, just checks the last 'thought' message in the state
    print("/////////////////// SHOULD CONTINUE CHECK /////////////////////")

    input = state['input']
    last_message = state['thought']

    #check does last_message contain "final answer"
    if "final answer" in last_message: return ACTION_FINAL_ANSWER
    if "terminate" in last_message: return ACTION_FINAL_ANSWER
    if last_message == "": return ACTION_FINAL_ANSWER

    prompt = isCompleteTemplate.format(
        input=last_message,
    )

    chat_completion = client.chat.completions.create(
        model="qwen-qwq-32b",
        response_model=ShouldContinueResponse,
        messages=[
            {
                "role": "system",
                "content": prompt,
                },
            {
                "role": "user",
                "content": input,
                }
            ],
    )
    # assert resp.name == "Jason"
    # assert resp.age == 25
    print("**************** SHOULD CONTINUE RESPONSE !!!!!! -->", chat_completion)

    message = chat_completion #.skip_to_answer
    # message = response.should_continue
    print("**************** SHOULD CONTINUE RESPONSE -->", message)

    if message == "yes":
        return ACTION_FINAL_ANSWER
    else:
        return ACTION_CONTINUE
