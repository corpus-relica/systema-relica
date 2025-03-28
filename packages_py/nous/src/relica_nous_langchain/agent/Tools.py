#!/usr/bin/env python3

import asyncio
from langchain.tools import tool
from langchain_core.utils.function_calling import convert_to_openai_tool

from src.relica_nous_langchain.SemanticModel import semantic_model
from src.relica_nous_langchain.services.aperture_client import aperture_client
from src.relica_nous_langchain.services.archivist_client import archivist_client


@tool
async def loadEntity(uid: int) -> str: #asyncio.Future:
    """LOAD ADDITIONAL ENTITIES. Use this when you know a UID but it's not in the current context. This tool is useful for following relationship chains when investigating what happened with entities.
        Args:
            uid: The unique identifier of the entity to load
    """
    uid = int(uid)
    result = await aperture_client.loadEntity(uid)

    if result is None:
        return "No entity with that uid exists"

    related_str = facts_to_related_entities_str(result["facts"])
    relationships_str = facts_to_relations_str(result["facts"])

    ret =  (
        f"\tRelated Entities (uid:name):\n"
        f"{related_str}\n"
        f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
        f"{relationships_str}"
    )

    return ret


@tool
async def getEntityOverview(uid: int)->str | None:
    """USE THIS FIRST FOR ANY ENTITY MENTIONED IN A QUESTION! Use this to retrieve comprehensive information about an entity, including any states, occurrences, or events it might be involved in. Always use this tool when the user asks about specific entities or "what happened" with entities.
        Args:
            uid: The unique identifier of the entity to retrieve details for
    """

    uid = int(uid)

    content = semantic_model.getModelRepresentation(uid)

    if content is None:
        content = "<<model not yet loaded>>. this is ok. load it using 'loadEntity'"

    # Select the entity
    # TODO - send actual user and environment ids
    await aperture_client.selectEntity(7, 1, uid)

    return content


@tool
async def cutToFinalAnswer(message: str)->str:
    """Invoke this to bypass ongoing dialogues and immediately supply the final, conclusive answer. It skips all intermediate conversation steps and allows to provide the direct outcome.
        Args:
            message: The final answer to the original input question
    """
    return "cut to the chase"

# @tool
# async def messageUser(message: str)->str:
#     """Invoke this to send messages to the user in casual conversation.
#         Args:
#             message: The message to the user
#     """
#     return "cut to the chase"

def facts_to_related_entities_str(facts) -> str:
    # Create a set of unique entities with their names
    entities = {}
    for f in facts:
        entities[f['lh_object_uid']] = f['lh_object_name']
        entities[f['rh_object_uid']] = f['rh_object_name']

    return "\n".join(f"- {name} (UID: {uid})" for uid, name in entities.items())

def facts_to_relations_str(facts) -> str:
    # Create a more detailed representation of relationships
    relations = []
    for f in facts:
        relation = f"- {f['lh_object_name']} (UID: {f['lh_object_uid']}) {f['rel_type_name']} (UID: {f['rel_type_uid']}) {f['rh_object_name']} (UID: {f['rh_object_uid']})"
        relations.append(relation)

    return "\n".join(relations)

def facts_to_metadata_str(facts) -> str:
    # Extract common metadata from the first fact (assuming consistent metadata)
    if not facts:
        return "No metadata available"

    f = facts[0]
    metadata = [
        f"- Collection: {f.get('collection_name', 'N/A')}",
        f"- Author: {f.get('author', 'N/A')}",
        f"- Reference: {f.get('reference', 'N/A')}",
        f"- Language: {f.get('language', 'N/A')}",
        f"- Status: {f.get('approval_status', 'N/A')}"
    ]

    return "\n".join(metadata)

@tool
async def textSearchExact(search_term: str)->str:
    """SEARCH FOR UNKNOWN ENTITIES OR EVENTS. Use this when you need to find entities by name that aren't yet loaded, or when searching for events, incidents, or occurrences that might not be visible in the current context.
        Args:
            search_term: The text term to search for (can be entity names, event types, etc.)
    """

    result = await aperture_client.textSearchLoad(search_term)

    # Check if result exists and has facts
    if result is None or "facts" not in result or len(result["facts"]) == 0:
        return f"No entity found with the name \"{search_term}\""

    facts = result["facts"]

    # Determine the main entity we're looking at
    entity_matches = [f for f in facts if f['lh_object_name'] == search_term or f['rh_object_name'] == search_term]
    if entity_matches:
        main_entity = search_term
        main_uid = entity_matches[0]['lh_object_uid'] if entity_matches[0]['lh_object_name'] == search_term else entity_matches[0]['rh_object_uid']
    else:
        # Fallback to the first fact's left-hand entity
        main_entity = facts[0]['lh_object_name']
        main_uid = facts[0]['lh_object_uid']

    # Build a structured, RAG-friendly output
    output = [
        f"ENTITY: {main_entity} (UID: {main_uid})",
        "",
        "RELATED ENTITIES:",
        facts_to_related_entities_str(facts),
        "",
        "RELATIONSHIPS:",
        facts_to_relations_str(facts),
        "",
        "METADATA:",
        facts_to_metadata_str(facts)
    ]

    # Add a note about getEntityDetails
    output.append(f"\nNote: These are the basic facts about '{main_entity}'. Use 'getEntityDetails' with UID {main_uid} for more comprehensive insights.")

    ret = "\n".join(output)

    # Select the entity
    # TODO - send actual user and environment ids
    await aperture_client.selectEntity(7, 1, main_uid)

    print("\\\\\\\\\\\\\\\\\\\\\\\\\\\\  SOME SHIT !!!! \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\")
    print(ret)

    return ret


# @tool
# async def specializeKind(name: str)->str:
#     """Use this to create a new subtype kind from the currently selected entity(kind). Provide the name of the new kind, and the system will create a new kind with that name, and return the uid of the new kind.
#         Args:
#             name: The name of the new kind to create
#     """
#     selected_entity = ccComms.selectedEntity
#     if selected_entity is None:
#         return "No entity is currently selected"
#     entity_name = semanticModel.models[selected_entity]['name']
#     result = ccComms.specializeKind(selected_entity, entity_name, name)

#     if("error" in result):
#         return result["error"]

#     return f"New kind '{name}' created with uid {result['uid']}"

# @tool
# async def classifyIndividual(name: str)->str:
#     """Use this to create a new individual from the currently selected entity(kind). Provide the name of the new individual, and the system will create a new individual with that name, and return the uid of the new individual.
#         Args:
#             name: The name of the new individual to create
#     """
#     selected_entity = ccComms.selectedEntity
#     if selected_entity is None:
#         return "No entity is currently selected"
#     entity_name = semanticModel.models[selected_entity]['name']
#     result = ccComms.classifyIndividual(selected_entity, entity_name, name)

#     if("error" in result):
#         return result["error"]

#     return f"New individual created with uid {result['uid']}"

# @tool
# async def specializationHierarchy(uid: int)->str:
#     """Use this to retrieve the specialization hierarchy of a kind. Provide the uid of the kind, and the system will return a string representation of the hierarchy.
#         Args:
#             uid: The unique identifier of the kind to retrieve the hierarchy for
#     """
#     uid = int(uid)
#     result = ccComms.retrieveSpecializationHierarchy(uid)

#     if result is None:
#         return "No kind with that uid exists"

#     related_str = semanticModel.facts_to_related_entities_str(result["facts"])
#     relationships_str = semanticModel.facts_to_relations_str(result["facts"])

#     ret =  (
#         f"\tRelated Entities (uid:name):\n"
#         f"{related_str}\n"
#         f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
#         f"{relationships_str}"
#     )

#     return ret

# @tool
# async def specializationFact(uid: int)->str:
#     """Use this to retrieve the specialization fact of a kind. Provide the uid of the kind, and the system will return a string representation of the specialization fact.
#         Args:
#             uid: The unique identifier of the kind to retrieve the specialization fact for
#     """
#     uid = int(uid)
#     result = ccComms.retrieveSpecializationFact(uid)

#     if result is None:
#         return "No kind with that uid exists"

#     related_str = semanticModel.facts_to_related_entities_str(result["facts"])
#     relationships_str = semanticModel.facts_to_relations_str(result["facts"])

#     ret =  (
#         f"\tRelated Entities (uid:name):\n"
#         f"{related_str}\n"
#         f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
#         f"{relationships_str}"
#     )

#     return ret

# @tool
# async def listSubtypes(uid: int)->str:
#     """Use this to retrieve the subtypes of a kind. Provide the uid of the kind, and the system will return a string representation of the subtypes.
#         Args:
#             uid: The unique identifier of the kind to retrieve the subtypes for
#     """
#     uid = int(uid)
#     result = ccComms.retrieveSubtypes(uid)

#     if result is None:
#         return "No kind with that uid exists"

#     related_str = semanticModel.facts_to_related_entities_str(result["facts"])
#     # relationships_str = semanticModel.facts_to_relations_str(result["facts"])

#     ret =  (
#         f"\tRelated Entities (uid:name):\n"
#         f"{related_str}\n"
#         # f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
#         # f"{relationships_str}"
#     )

#     return ret

# @tool
# async def classified(uid: int)->str:
#     """Use this to retrieve the classified entities of a kind. Provide the uid of the kind, and the system will return a string representation of the classified entities.
#         Args:
#             uid: The unique identifier of the kind to retrieve the classified entities for
#     """
#     uid = int(uid)
#     result = ccComms.retrieveClassified(uid)

#     if result is None:
#         return "No kind with that uid exists"

#     related_str = semanticModel.facts_to_related_entities_str(result["facts"])
#     relationships_str = semanticModel.facts_to_relations_str(result["facts"])

#     ret =  (
#         f"\tRelated Entities (uid:name):\n"
#         f"{related_str}\n"
#         f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
#         f"{relationships_str}"
#     )

#     return ret

# @tool
# async def classificationFact(uid: int)->str:
#     """Use this to retrieve the classification fact of an individual. Provide the uid of the individual, and the system will return a string representation of the classification fact.
#         Args:
#             uid: The unique identifier of the individual to retrieve the classification fact for
#     """
#     uid = int(uid)
#     result = ccComms.retrieveClassificationFact(uid)

#     if result is None:
#         return "No individual with that uid exists"

#     related_str = semanticModel.facts_to_related_entities_str(result["facts"])
#     relationships_str = semanticModel.facts_to_relations_str(result["facts"])

#     ret =  (
#         f"\tRelated Entities (uid:name):\n"
#         f"{related_str}\n"
#         f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
#         f"{relationships_str}"
#     )

#     return ret

@tool
async def getEntityDetails(uid: int)->str:
    """DISCOVER COMPLETE RELATIONSHIPS! Use this to explore ALL connections to an entity, essential for understanding what happened with entities or their components. Always use this tool when asked about events, incidents, or changes involving an entity.
        Args:
            uid: The unique identifier of the entity to retrieve all related facts for
    """
    uid = int(uid)
    # TODO - send actual user and environment ids
    result = await aperture_client.loadAllRelatedFacts(7, 1, uid)

    if result is None:
        return "No entity with that uid exists"

    related_str = facts_to_related_entities_str(result["facts"])
    relationships_str = facts_to_relations_str(result["facts"])

    ret =  (
        f"\tRelated Entities (uid:name):\n"
        f"{related_str}\n"
        f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
        f"{relationships_str}"
    )

    return ret

# from langchain_openai import ChatOpenAI
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.output_parsers import StrOutputParser

# @tool
# async def findSuitableSupertype(description: str)->str:
#     """Use this to find a suitable supertype for a new, proposed,  kind. Provide the name and brief description of the new kind, and the system will select a suitable supertype from the currently selected kinds subtypes.  If the new kind is found to be sibling concept, will inform that the new kind should directly specialize the currently selected kind.  Finally, may declare the new kind unsuitable as a subtype of the currently selected kind(direct or otherwise).
#         Args:
#             description: The name and description of the new kind to find a suitable supertype for
#     """
#     # result = ccComms.findSuitableSubtype(name)
#     selected_entity = ccComms.selectedEntity
#     subtypes = ccComms.retrieveSubtypes(selected_entity)

#     #map over subtypes to get the kind names
#     subtypes_str = ""
#     for fact in subtypes["facts"]:
#         subtypes_str += f"{fact['lh_object_uid']} - {fact['lh_object_name']} - {fact.get('full_definition', fact.get('partial_definition', 'No definition available'))};\n"

#     prompt_str = """
#     which of the following subtypes is suitable for the new kind? provide the uid of the suitable kind, if none are suitable, provide 'none' \n
#     {subtypes_str}
#     \n
#     Description: {description}
#     \n
#     Let's think this through...
#     """
#     prompt = ChatPromptTemplate.from_template(prompt_str)
#     model = ChatOpenAI(model="gpt-4-turbo-preview")
#     output_parser = StrOutputParser()

#     chain = prompt | model | output_parser
#     response = chain.invoke({
#         "subtypes_str": subtypes_str,
#         "description": description
#     })

#     return response

tools = [
         textSearchExact,
         loadEntity,
         getEntityOverview,
         getEntityDetails,
         cutToFinalAnswer,
         # # specializeKind,
         # # classifyIndividual,
         # # #
         # specializationHierarchy,
         # specializationFact,
         # classified,
         # classificationFact,
         # listSubtypes,
         # findSuitableSupertype,
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
