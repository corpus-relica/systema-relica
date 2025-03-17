#!/usr/bin/env python3

from typing import Annotated

from langchain_anthropic import ChatAnthropic
from typing_extensions import TypedDict

from langgraph.graph import StateGraph
from langgraph.graph.message import add_messages

from langgraph.checkpoint.memory import MemorySaver
from langchain_core.prompts import ChatPromptTemplate
from datetime import datetime

from src.relica_nous_langchain.SemanticModel import semantic_model

memory = MemorySaver()

class State(TypedDict):
    messages: Annotated[list, add_messages]


graph_builder = StateGraph(State)


# llm = ChatAnthropic(model="claude-3-5-sonnet-20240620")
llm = ChatAnthropic(model="claude-3-7-sonnet-latest")

someshit= '''
This formalization outlines abstract entities, relations, and roles, serving as a foundational blueprint. It sets the stage for a more specific model to follow, detailing the architecture of semantic relationships

    Notional Entities: let NE be the set of all notional entities.
    NE={ne1,ne2,...,nen}
    Notional Relations: let NR be the set of all notional relations.
    NR={nr1,nr2,...,nrn}
    Notional Gellish Knowledge Model: let NG be the notional Gellish knowledge model, defined as the combination of NE and NR.
    NG=(NE,NR)
    Notional Kinds: let NK be the set of conceptual kinds.
    NK={nk1,nk2,...,nkn} where NK⊂NE
    Notional Individuals: let NI be the set of Individuals.
    NI={ni1,ni2,...,nin} where NI⊂NE
    Disjoint Notional Kinds and Individuals: NK and NI are disjoint subsets of NE.
    NK∩NI=∅
    Union of Notional Kinds and Individuals: NE is solely comprised of NK and NI.
    NE=NK∪NI
    Kinds of Notional Relations: Let KNR be the set of all notional relation kinds.
    KNR={knr1,knr2,…,knrn} where KNR⊂NK
    Existance of Specialization Relation: sr∊KNR
    Existance of Classification Relation: cr∊KNR
    Kinds of Notional Roles: Let KNΓ be the set of all notional role kinds.
    KNΓ={knγ1,knγ2,…,knγn} where KNΓ⊂NK
    Disjoint Notional Relations and Roles: KNR and KNΓ are disjoint subsets of NK.
    KNR∩KNΓ=∅
    Required Roles in Kinds of Notional Relations: A kind of notional relation r∊KNR can require one to n kinds of roles from KNΓ.
    KNRreq={(r,γ1,γ2,…,γn)∣r∊KNR,γi∊KNΓ}
    Role-playing Kinds: A kind k∊NK can play one or more roles from KNΓ.
    NKplay={(k,γ1,γ2,…,γm)∣k∊NK,γi∊KNΓ}
    Notional Individuals Classified as Notional Kinds: Every notional individual i∊NI is classified as some notional kind k∊NK.
    NIclass={(i,k)|i∊NI,k∊NK}
    Notional Relations Classified as Notional Relation Kinds: Every notional relation r∊NR is classified as some notional relation kind kr∊KNR.
    NRclass={(r,kr)∣r∊NR,kr∊KNR}
    Role Requirements in Classified Notional Relations: An classified notional relation r∊NR, which is classified as some kind kr∊KNR, will relate 1 to n notional individuals according to the roles required by kr.
    NRreq={(r,i1,i2,…,in)∣r∊NR,ij∊NI,(r,kr)∊NRclass,(kr,γ1,γ2,…,γn)∊KNRreq}
    Role Alignment in Classified Notional Relations: For a classified notional relation r, every notional individual ij related by r must play a role that aligns with the roles required by the kind kr of which r is classified.
    NRalign={(r,ij,γj)∣(r,ij)∊NRreq,(γj,ij)∊NIclass,(γj)∊KNRreq}
    Subtype-Supertype Pairs: We can define a set that contains all pairs of subtypes and supertypes connected by a specialization relation.
    SubSupPairs={(k1,k2,sr)|k1,k2∊NK,sr∊SR}
    Root of Specialization Hierarchy: Let Root represent the most general kind, 'Anything.'
    Root={anything}where Root⊂NK
    All Kinds are Subtypes of 'Anything': Every kind k in NK is either directly or indirectly a subtype of 'Anything,' connected by a specialization relation.
    ∀k∊NK,∃sr:(k,anything,sr)∊SubSupPairsor∃k′∊NK:(k,k′,sr)∊SubSupPairs&(k′,anything,sr)∊SubSupPairs.
'''

primary_assistant_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are NOUS a helpful semantic modelling assistant for Systema Relica."
            "Use the provided information to answer the questions."
            # "Don't lean on your own understanding. Answer questions based only on what the model says."
            "Focus on understanding the structure and relationships in the data, rather than trying to memorize every detail."
            "Be comfortable with referring back to the provided information as needed, rather than relying on potentially faulty recall."
            "Be clear about what information is directly from the data and what might be an interpretation or assumption."
            "Ask for clarification when needed, instead of making assumptions to fill in gaps."
            "Be more confident in initial correct assessments, while still remaining open to correction."

            # " Use the provided tools to search for flights, company policies, and other information to assist the user's queries. "
            # " When searching, be persistent. Expand your query bounds if the first search returns no results. "
            # " If a search comes up empty, expand your search before giving up."
            "\n\nInformation about the Semantic Model:\n<Background>\n{bg}\n</Background>"
            "\n\nCurrent Environment:\n<Environment>\n{env}\n</Environment>"
            "\n\nCurrent Selected Entity:\n{selected_entity}</SelectedEntity>\n\n"
            "\nCurrent time: {time}.",
        ),
        ("placeholder", "{messages}"),
    ]
).partial(time=datetime.now)


def chatbot(state: State):
    messages = state["messages"]
    prompt= primary_assistant_prompt.invoke({
        "selected_entity": semantic_model.selected_entity,
        # object to string
        "env": str(semantic_model.models),
        "bg": someshit,
        "messages": messages})
    # print("CHATBOT @@@@@@@@@@@@@@@@@", semantic_model.selected_entity)
    print("CHATBOT @@@@@@@@@@@@@@@@@", prompt.to_messages())
    return {"messages": [llm.invoke(prompt)]}


# The first argument is the unique node name
# The second argument is the function or object that will be called whenever
# the node is used.
graph_builder.add_node("chatbot", chatbot)
graph_builder.set_entry_point("chatbot")
graph_builder.set_finish_point("chatbot")
graph = graph_builder.compile(checkpointer=memory)

config = {"configurable": {"thread_id": "1"}}


def stream_graph_updates(user_input: str):
    for event in graph.stream({"messages": [
                                            {"role": "user", "content": user_input}]},
                              config):
        for value in event.values():
            print("Assistant:", value["messages"][-1].content)

# def get_response(user_input: str):
#     return next(graph.stream({"messages": [{"role": "user", "content": user_input}]}))

async def get_response(user_input: str):
    async for event in graph.astream({"messages": [
                                                   {"role": "user", "content": user_input}]},
                                     config):
        if "chatbot" in event and "messages" in event["chatbot"]:
            messages = event["chatbot"]["messages"]
            if messages:
                return messages[-1].content
    return None


# while True:
#     try:
#         user_input = input("User: ")
#         if user_input.lower() in ["quit", "exit", "q"]:
#             print("Goodbye!")
#             break

#         stream_graph_updates(user_input)
#     except:
#         # fallback if input() is not available
#         user_input = "What do you know about LangGraph?"
#         print("User: " + user_input)
#         stream_graph_updates(user_input)
#         break
