#!/usr/bin/env python3


################################################################################## COULDNT ANSWER

# couldnt_answer_llm = ChatOpenAI(
#     model=openAIModel,
#     temperature=0,
#     max_tokens=1000,
#     timeout=None,
#     max_retries=2,
#     stop=['\nObservation',
#           '\nFinal Answer',
#           '\nThought',
#           '\nAction'],
#     )

# def couldnt_answer(state):
#     messages = state['messages']
#     messages_str = "\n".join(messages)

#     prompt = couldnt_answer_template.format(
#         curr_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
#         semantic_model=semanticModel.getModelRepresentation(ccComms.selectedEntity),
#         context=semanticModel.context,
#         agent_scratchpad=messages_str,
#         chat_history=memory.load_memory_variables({})
#     )

#     response = couldnt_answer_llm.invoke([("system", prompt + '\nFinal Answer: ')])

#     print(prompt + "\nFinal Answer: ")

#     print("/////////////////// COULDNT ANSWER /////////////////////")
#     message = response.content
#     print(message)

#     memory.save_context(
#         {"input": state['input']},
#         {"output": message}
#     )

#     return {
#         "messages": ['Final Answer: ' + message],
#         "answer": message
#     }
