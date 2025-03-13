
#!/usr/bin/env python3
import getpass
import os
from typing import Optional

if not os.environ.get("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = getpass.getpass("Enter your OpenAI API key: ")

from datetime import datetime
# from openai import OpenAI
from langchain_openai import ChatOpenAI

from src.relica_nous_langchain.compere.Templates import prefix, template, final_answer_template

from src.relica_nous_langchain.utils.EventEmitter import EventEmitter

# from src.relica_nous_langchain.services.CCComms import ccComms
from src.relica_nous_langchain.services.clarity_client import clarity_client

from src.relica_nous_langchain.SemanticModel import semanticModel

# from src.relica_nous_langchain.compere.Tools import askAgent
from src.relica_nous_langchain.agent.NOUSAgent import nousAgent
# from src.relica_nous_langchain.agent.NOUSAgent_new import nousAgent

from src.relica_nous_langchain.compere.MySemanticRouter import semantic_router
from pydantic import BaseModel, Field, StrictInt


class AnswerWithJustification(BaseModel):
    '''An answer to the user question along with justification for the answer.'''

    answer: StrictInt = Field(
        ..., description="The uid of the answer to the user question."
    )
    justification: Optional[str] = Field(
        default=..., description="A justification for the answer."
    )

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    # api_key="...",  # if you prefer to pass api key in directly instaed of using env vars
    # base_url="...",
    # organization="...",
    # other params...
)


# memory = ConversationBufferWindowMemory(memory_key="chat_history", k=25)

# llm_chain = LLMChain(llm=OpenAI(temperature=0), prompt=chatPrompt)

# agent = ZeroShotAgent(llm_chain=llm_chain, tools=tools, verbose=True)

# agent_chain = AgentExecutor.from_agent_and_tools(
#     agent=agent, tools=tools, verbose=True, memory=memory, handle_parsing_errors=True
# )

def retrieveEnv():
    env = ccComms.retrieveEnvironment()
    print("---- ENVIRONMENT!")
    # print(env)
    # semanticModel.addFacts(env['facts'])
    ccComms.selectedEntity = env['selectedEntity']
    # semanticModel.addModels(env['models'])

def extract_entity(content):
    system_message = '''
    You are an expert in entity extraction, specifically for identifying subtypes from given contexts.

    Task:
    Given a phrase that mentions an entity and its potential supertype, extract and return only the entity (subtype).

    Guidelines:
    1. Always return a single entity.
    2. Use lowercase for the returned entity.
    3. Return only the entity, without any additional text or explanation.
    4. If multiple entities are present, return the most specific one.

    Examples:
    1. Input: "What would be a good supertype for the concept of apple?"
       Output: apple

    2. Input: "Which category would best serve as a supertype for bicycle?"
       Output: bicycle

    3. Input: "Among fruits, what subtype would be appropriate as a supertype for the concept of apple?"
       Output: apple

    4. Input: "Is vehicle a suitable supertype for car?"
       Output: car

    5. Input: "Could animal be considered a supertype for both dog and cat?"
       Output: dog

    Remember: Always prioritize extracting the most specific entity mentioned, regardless of the phrasing or complexity of the input.
    '''

    messages = [
        ("system", system_message),
        ("human", f"Extract the entity from this phrase: {content}")
    ]
    response = llm.invoke(messages)
    return response.content.strip()



def find_best_supertype_recursive(entity, current_supertype):
    print(f"Analyzing entity: {entity}, current supertype: {current_supertype}")
    subtypes_res = ccComms.retrieveSubtypes(current_supertype)
    if not subtypes_res['facts']:
        return current_supertype

    current_supertype_name = subtypes_res['facts'][0]['rh_object_name']
    subtype_entities = [[fact['lh_object_uid'], fact['lh_object_name'], fact['full_definition']] for fact in subtypes_res['facts']]

    subtype_entities_str = "\n".join([f"{e[0]}: {e[1]} - {e[2]}" for e in subtype_entities])

    system_message = f'''
You are an expert in taxonomic hierarchies and concept classification. Your task is to determine the most appropriate position for a given concept within a taxonomy.

Key points:
1. Analyze the given concept and the list of potential supertypes.
2. Consider both obvious and non-obvious relationships between concepts.
3. Your goal is to find the most specific yet accurate supertype for the given concept.
4. If none of the provided options are suitable, you may choose to keep the current supertype.

Remember: The best choice may not always be the most obvious one. Use your knowledge of conceptual relationships to make the most appropriate decision.
'''

    user_message = f'''
Given concept: "{entity}"

Current supertype: "{current_supertype}" ("{current_supertype_name}")

Potential supertypes (subtypes of the current supertype):
{subtype_entities_str}

Task:
1. Analyze the given concept "{entity}" and the list of potential supertypes.
2. Determine which of these would be the most appropriate supertype for "{entity}".
3. If none of the listed options are suitable, you may choose to keep the current supertype "{current_supertype}".

Provide your answer as follows:
1. The UID of the chosen supertype (or the current supertype's UID if no better option is found).
2. A brief justification for your choice (1-2 sentences).

Your response should be structured and concise, focusing on the most relevant aspects of your decision.
'''

    subtype_entity_uids = [str(e[0]) for e in subtype_entities]

    print("SYSTEM MESSAGE:", system_message)
    print("USER MESSAGE:", user_message)
    print("SUBTYPE ENTITIES:", subtype_entity_uids)

    structured_llm = llm.with_structured_output(AnswerWithJustification, strict=True)
    response = structured_llm.invoke([
        ("system", system_message),
        ("user", user_message),
    ])

    print("RESPONSE:", response)
    choice = response.answer
    print("CHOICE:", choice)

    if not choice or str(choice) == str(current_supertype):
        return [(current_supertype, response.justification)]
    else:
        res = find_best_supertype_recursive(entity, choice)
        res.append((choice, response.justification))
        return res

memory = []

#i don't know python how do I define a function that I wll call recursively:

class NOUSCompere:
    def __init__(self):
        print("NOUS Compère")
        self.emitter = EventEmitter()

    async def handleInput(self, user_input):
        retrieveEnv()

        # strip any whitespace on either side (including newlines)
        user_input = user_input.strip()

        try:

            print("user_input --> ", user_input)

            semanticRoute = semantic_router.handle_input(user_input)

            print("semanticRoute --> ", semanticRoute)

            if(semanticRoute == "taxonomic_positioning_query"):
                print("TAXONOMIC POSITIONING QUERY")
                # response = "TAXONOMIC POSITIONING QUERY"

                memory.append(("human", user_input))
                memory.append(("assistant", "I'm running my taxonomic positioning subroutine. Please wait..."))
                self.emitter.emit('final_answer', {"role": "assistant", "content": "I'm running my taxonomic positioning subroutine. Please wait..."})

                entity = extract_entity(user_input)

                print("entity --> ", entity)

                result = find_best_supertype_recursive(entity, ccComms.selectedEntity)

                print("result --> ", result)

                res = result[0][0]

                print("res --> ", res)

                if res != None:
                    fact = ccComms.retrieveSpecializationFact(res)
                    objectUID = fact['facts'][0]['lh_object_uid']
                    objectName = fact['facts'][0]['lh_object_name']
                    reasoning = [f[1] for f in result]
                    reasoning = "\n".join([f"- {r}" for r in reasoning])
                    message = f'''"{objectName}"({objectUID}) is the best supertype for the concept of "{entity}" because of the following reasoning:\n\n{reasoning}'''

                    memory.append(("assistant", message))
                    self.emitter.emit('final_answer', {"role": "assistant", "content": message})

            elif(semanticRoute == "default"):
                print("NO ROUTE FOUND")
                response = await nousAgent.handleInput(user_input)
                print("RESPONSE --> ", response)
                # print("selected entity --> ", ccComms.selectedEntity)

                # current_time = datetime.now().strftime("%Y-%m-%d %H:%M")
                # system_message = prefix.format(
                #     entities=semanticModel.facts_to_related_entities_str(semanticModel.facts),
                #     relationships=semanticModel.facts_to_relations_str(semanticModel.facts),
                #     facts=semanticModel.facts_to_str(semanticModel.facts),
                #     focus=semanticModel.getModelRepresentation(ccComms.selectedEntity)
                # )

                # system_message += "the current date and time is " + current_time + "\n"

                # print("system_message --> ", system_message)
                # print("user_input --> ", user_input)

                # messages = [
                #     ("system", system_message),
                # ]
                # # concatenate messages and memory
                # messages.extend(memory)
                # messages.append(("human", user_input))

                # response = llm.invoke(messages)

                # print("RESPONSE --> ", response.content)

                memory.append(("human", user_input))
                memory.append(("assistant", response))

                # self.emitter.emit('final_answer', {"role": "assistant", "content": response.content})
                self.emitter.emit('final_answer', {"role": "assistant", "content": response})

        except Exception as e:
            print("NOUSCompere - An error occured:", e)

            error_message = {'role': 'assistant', 'content': 'Oops! An error occurred. Please try again.'}
            self.emitter.emit('final_answer', error_message)

nousCompere = NOUSCompere()
