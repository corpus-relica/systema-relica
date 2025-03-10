#!/usr/bin/env python3

import asyncio
from langchain.tools import tool
from langchain_core.utils.function_calling import convert_to_openai_tool

from src.relica_nous_langchain.SemanticModel import semanticModel
from src.relica_nous_langchain.services.CCComms import ccComms


@tool
async def loadEntity(uid: int) -> str: #asyncio.Future:
    """Use this to load an entity that is not currently loaded in the system. Provide the unique identifier (uid) of the entity, and the system will load it, returning detailed information about the entity.
        Args:
            uid: The unique identifier of the entity to load
    """
    uid = int(uid)
    result = ccComms.loadEntity(uid)

    if result is None:
        return "No entity with that uid exists"

    related_str = semanticModel.facts_to_related_entities_str(result["facts"])
    relationships_str = semanticModel.facts_to_relations_str(result["facts"])

    ret =  (
        f"\tRelated Entities (uid:name):\n"
        f"{related_str}\n"
        f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
        f"{relationships_str}"
    )

    return ret


@tool
async def getEntityDetails(uid: int)->str | None:
    """USE THIS FIRST!, use this to retrieve their full details. Provide the entity's uid, and the system will fetch comprehensive information, including details about related uids not fully loaded in the current context. Opt for this instead of 'loadEntity' or 'textSearchExact' for entities that are already present in the system.
        Args:
            uid: The unique identifier of the entity to retrieve details for
    """
    uid = int(uid)

    content = semanticModel.getModelRepresentation(uid)

    if content is None:
        content = "<<model not yet loaded>>. this is ok. load it using 'loadEntity'"

    ccComms.emit("nous", "selectEntity", { "uid": uid })
    return content


@tool
async def cutToFinalAnswer(message: str)->str:
    """Invoke this to bypass ongoing dialogues and immediately supply the final, conclusive answer. It skips all intermediate conversation steps and allows to provide the direct outcome.
        Args:
            message: The final answer to the original input question
    """
    return "cut to the chase"


@tool
async def textSearchExact(search_term: str)->str:
    """use this ONLY IF THE UID IS UNKOWN! Use this to find and load an entity with a name that exactly matches a given text term. It loads the entity into the application context and returns detailed information about it. If the entity is already loaded, switch to 'getEntityDetails' for more comprehensive insights about the entity.
        Args:
            search_term: The text term to search for
    """

    result = ccComms.textSearchExact(search_term)

    if result is None or len(result["facts"]) == 0:
        return f"No entity with found by the name \"{search_term}\""

    related_str = semanticModel.facts_to_related_entities_str(result["facts"])
    relationships_str = semanticModel.facts_to_relations_str(result["facts"])

    ret =  (
        f"\tRelated Entities (uid:name):\n"
        f"{related_str}\n"
        f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
        f"{relationships_str}"
    )

    ret += f"\nthese are just the basic facts about '{search_term}'. use 'getEntityDetails' for more comprehensive insights about the entity."
    ccComms.emit("nous", "selectEntity", { "uid": result["facts"][0]["lh_object_uid"] })
    return ret


@tool
async def specializeKind(name: str)->str:
    """Use this to create a new subtype kind from the currently selected entity(kind). Provide the name of the new kind, and the system will create a new kind with that name, and return the uid of the new kind.
        Args:
            name: The name of the new kind to create
    """
    selected_entity = ccComms.selectedEntity
    if selected_entity is None:
        return "No entity is currently selected"
    entity_name = semanticModel.models[selected_entity]['name']
    result = ccComms.specializeKind(selected_entity, entity_name, name)

    if("error" in result):
        return result["error"]

    return f"New kind '{name}' created with uid {result['uid']}"

@tool
async def classifyIndividual(name: str)->str:
    """Use this to create a new individual from the currently selected entity(kind). Provide the name of the new individual, and the system will create a new individual with that name, and return the uid of the new individual.
        Args:
            name: The name of the new individual to create
    """
    selected_entity = ccComms.selectedEntity
    if selected_entity is None:
        return "No entity is currently selected"
    entity_name = semanticModel.models[selected_entity]['name']
    result = ccComms.classifyIndividual(selected_entity, entity_name, name)

    if("error" in result):
        return result["error"]

    return f"New individual created with uid {result['uid']}"

@tool
async def specializationHierarchy(uid: int)->str:
    """Use this to retrieve the specialization hierarchy of a kind. Provide the uid of the kind, and the system will return a string representation of the hierarchy.
        Args:
            uid: The unique identifier of the kind to retrieve the hierarchy for
    """
    uid = int(uid)
    result = ccComms.retrieveSpecializationHierarchy(uid)

    if result is None:
        return "No kind with that uid exists"

    related_str = semanticModel.facts_to_related_entities_str(result["facts"])
    relationships_str = semanticModel.facts_to_relations_str(result["facts"])

    ret =  (
        f"\tRelated Entities (uid:name):\n"
        f"{related_str}\n"
        f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
        f"{relationships_str}"
    )

    return ret

@tool
async def specializationFact(uid: int)->str:
    """Use this to retrieve the specialization fact of a kind. Provide the uid of the kind, and the system will return a string representation of the specialization fact.
        Args:
            uid: The unique identifier of the kind to retrieve the specialization fact for
    """
    uid = int(uid)
    result = ccComms.retrieveSpecializationFact(uid)

    if result is None:
        return "No kind with that uid exists"

    related_str = semanticModel.facts_to_related_entities_str(result["facts"])
    relationships_str = semanticModel.facts_to_relations_str(result["facts"])

    ret =  (
        f"\tRelated Entities (uid:name):\n"
        f"{related_str}\n"
        f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
        f"{relationships_str}"
    )

    return ret

@tool
async def listSubtypes(uid: int)->str:
    """Use this to retrieve the subtypes of a kind. Provide the uid of the kind, and the system will return a string representation of the subtypes.
        Args:
            uid: The unique identifier of the kind to retrieve the subtypes for
    """
    uid = int(uid)
    result = ccComms.retrieveSubtypes(uid)

    if result is None:
        return "No kind with that uid exists"

    related_str = semanticModel.facts_to_related_entities_str(result["facts"])
    # relationships_str = semanticModel.facts_to_relations_str(result["facts"])

    ret =  (
        f"\tRelated Entities (uid:name):\n"
        f"{related_str}\n"
        # f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
        # f"{relationships_str}"
    )

    return ret

@tool
async def classified(uid: int)->str:
    """Use this to retrieve the classified entities of a kind. Provide the uid of the kind, and the system will return a string representation of the classified entities.
        Args:
            uid: The unique identifier of the kind to retrieve the classified entities for
    """
    uid = int(uid)
    result = ccComms.retrieveClassified(uid)

    if result is None:
        return "No kind with that uid exists"

    related_str = semanticModel.facts_to_related_entities_str(result["facts"])
    relationships_str = semanticModel.facts_to_relations_str(result["facts"])

    ret =  (
        f"\tRelated Entities (uid:name):\n"
        f"{related_str}\n"
        f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
        f"{relationships_str}"
    )

    return ret

@tool
async def classificationFact(uid: int)->str:
    """Use this to retrieve the classification fact of an individual. Provide the uid of the individual, and the system will return a string representation of the classification fact.
        Args:
            uid: The unique identifier of the individual to retrieve the classification fact for
    """
    uid = int(uid)
    result = ccComms.retrieveClassificationFact(uid)

    if result is None:
        return "No individual with that uid exists"

    related_str = semanticModel.facts_to_related_entities_str(result["facts"])
    relationships_str = semanticModel.facts_to_relations_str(result["facts"])

    ret =  (
        f"\tRelated Entities (uid:name):\n"
        f"{related_str}\n"
        f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
        f"{relationships_str}"
    )

    return ret

@tool
async def allRelatedFacts(uid: int)->str:
    """Use this to retrieve all facts related to an entity (not including subtypes of a kind). Provide the uid of the entity, and the system will return a string representation of all facts related to the entity.
        Args:
            uid: The unique identifier of the entity to retrieve all related facts for
    """
    uid = int(uid)
    result = ccComms.retrieveAllRelatedFacts(uid)

    if result is None:
        return "No entity with that uid exists"

    related_str = semanticModel.facts_to_related_entities_str(result["facts"])
    relationships_str = semanticModel.facts_to_relations_str(result["facts"])

    ret =  (
        f"\tRelated Entities (uid:name):\n"
        f"{related_str}\n"
        f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
        f"{relationships_str}"
    )

    return ret

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

@tool
async def findSuitableSupertype(description: str)->str:
    """Use this to find a suitable supertype for a new, proposed,  kind. Provide the name and brief description of the new kind, and the system will select a suitable supertype from the currently selected kinds subtypes.  If the new kind is found to be sibling concept, will inform that the new kind should directly specialize the currently selected kind.  Finally, may declare the new kind unsuitable as a subtype of the currently selected kind(direct or otherwise).
        Args:
            description: The name and description of the new kind to find a suitable supertype for
    """
    # result = ccComms.findSuitableSubtype(name)
    selected_entity = ccComms.selectedEntity
    subtypes = ccComms.retrieveSubtypes(selected_entity)

    #map over subtypes to get the kind names
    subtypes_str = ""
    for fact in subtypes["facts"]:
        subtypes_str += f"{fact['lh_object_uid']} - {fact['lh_object_name']} - {fact.get('full_definition', fact.get('partial_definition', 'No definition available'))};\n"

    prompt_str = """
    which of the following subtypes is suitable for the new kind? provide the uid of the suitable kind, if none are suitable, provide 'none' \n
    {subtypes_str}
    \n
    Description: {description}
    \n
    Let's think this through...
    """
    prompt = ChatPromptTemplate.from_template(prompt_str)
    model = ChatOpenAI(model="gpt-4-turbo-preview")
    output_parser = StrOutputParser()

    chain = prompt | model | output_parser
    response = chain.invoke({
        "subtypes_str": subtypes_str,
        "description": description
    })

    return response

tools = [
         getEntityDetails,
         loadEntity,
         cutToFinalAnswer,
         textSearchExact,
         # specializeKind,
         # classifyIndividual,
         # #
         specializationHierarchy,
         specializationFact,
         classified,
         classificationFact,
         allRelatedFacts,
         listSubtypes,
         findSuitableSupertype,
         ]
tool_names = [tool.name for tool in tools]
tool_descriptions = [convert_to_openai_tool(tool) for tool in tools]
converted_tools = [convert_to_openai_tool(tool) for tool in tools]


# NGL: this is a hack to get the tool descriptions to be in the right format
tool_descriptions = [tool["function"] for tool in tool_descriptions]
foobarbazqux = ""
for tool in tool_descriptions:
    foobarbazqux += '\t' + tool["name"] + ": "
    foobarbazqux += tool["description"] + "\n\n"
foobarbazqux = foobarbazqux[:-1]
tool_descriptions = foobarbazqux
