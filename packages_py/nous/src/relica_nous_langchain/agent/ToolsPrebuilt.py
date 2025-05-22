#!/usr/bin/env python3

from rich import print

import asyncio
from langchain_core.utils.function_calling import convert_to_openai_tool

from src.relica_nous_langchain.SemanticModel import semantic_model
from src.relica_nous_langchain.services.aperture_client import ApertureClientProxy
from src.relica_nous_langchain.services.archivist_client import ArchivistClientProxy

def facts_to_related_entities_str(facts) -> str:
    entities = {}
    for f in facts:
        entities[f['lh_object_uid']] = f['lh_object_name']
        entities[f['rh_object_uid']] = f['rh_object_name']

    return "\n".join(f"- {name} (UID: {uid})" for uid, name in entities.items())

def facts_to_relations_str(facts) -> str:
    relations = []
    for f in facts:
        relation = f"- {f['lh_object_name']} (UID: {f['lh_object_uid']}) {f['rel_type_name']} (UID: {f['rel_type_uid']}) {f['rh_object_name']} (UID: {f['rh_object_uid']})"
        relations.append(relation)

    return "\n".join(relations)

def facts_to_metadata_str(facts) -> str:
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

def create_agent_tools(aperture_proxy: ApertureClientProxy,
                       archivist_proxy: ArchivistClientProxy):
    """Creates and returns LangChain tools and related metadata configured with a specific ApertureClientProxy."""


    # --- Search Tools --- #

    async def textSearchLoad(search_term: str)->str:
        """Searches the Semantic Model for entities matching the exact search term string and loads grounding facts into the environment.
        Args:
            search_term: The exact string to search for in entity names.
        """
        # The ApertureClientProxy will automatically prepend user_id and env_id
        # when calling the actual textSearchLoad method.
        print(f"Tool 'textSearchExact' called with search_term: {search_term}")
        try:
            result = await aperture_proxy.textSearchLoad(search_term)
            print(f"Result from aperture_proxy.textSearchLoad: {result}")

            # if result is None or "facts" not in result or len(result["facts"]) == 0:
            #     return f"No entity found with the name \"{search_term}\""

            environment = result #.get('environment')
            facts = environment.get('facts', [])

            # Process the result to return a concise summary or list of UIDs
            uids = [fact['lh_object_uid'] for fact in facts]
            if not uids:
                return f"No entity found with the name \"{search_term}\""
            else:
                return f"Found entities matching \"{search_term}\": UIDs {uids}"

        except Exception as e:
            # Log the exception for debugging
            print(f"Error in textSearchExact tool: {e}")
            # Return a user-friendly error message
            return f"An error occurred while searching for '{search_term}': {e}"


    async def uidSearchLoad(search_uid: int)->str:
        """Searches the Semantic Model for entities matching the exact uid and loads grounding facts into the environment.
        Args:
            search_uid: The exact uid to search for in entity uids.
        """
        # The ApertureClientProxy will automatically prepend user_id and env_id
        # when calling the actual textSearchLoad method.
        print(f"Tool 'uidSearchLoad' called with search_uid: {search_uid}")
        try:
            result = await aperture_proxy.uidSearchLoad(search_uid)
            print(f"Result from aperture_proxy.uidSearchLoad: {result}")

            # if result is None or "facts" not in result or len(result["facts"]) == 0:
            #     return f"No entity found with the name \"{search_uid}\""

            environment = result#.get('environment')
            facts = environment.get('facts', [])

            # Process the result to return a concise summary or list of UIDs
            uids = [fact['lh_object_uid'] for fact in facts]
            if not uids:
                return f"No entity found with the name \"{search_uid}\""
            else:
                return f"Found entities matching \"{search_uid}\": UIDs {uids}"

        except Exception as e:
            # Log the exception for debugging
            print(f"Error in textSearchLoad tool: {e}")
            # Return a user-friendly error message
            return f"An error occurred while searching for '{search_uid}': {e}"


    # --- Specialization Operations --- #

    async def loadDirectSupertypes(uid: int)->str:
        """Use this to retrieve the specialization fact(s) of a kind, it's supertypes. Provide the uid of the kind, and the system will return a string representation of the specialization fact.
            Args:
                uid: The unique identifier of the kind to retrieve the specialization fact for
        """
        uid = int(uid)
        # Assumes retrieveSpecializationFact exists on the proxy/client
        result = await aperture_proxy.loadSpecializationFact(uid)

        if result is None or ('facts' not in result):
             return "No kind with that uid exists or no facts returned"

        related_str = facts_to_related_entities_str(result["facts"])
        relationships_str = facts_to_relations_str(result["facts"])

        ret =  (
            f"\tRelated Entities (uid:name):\n"
            f"{related_str}\n"
            f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
            f"{relationships_str}"
        )
        return ret


    async def loadDirectSubtypes(uid: int)->str:
        """Use this to retrieve the direct subtypes of a kind. Provide the uid of the kind, and the system will return a string representation of the subtypes.
            Args:
                uid: The unique identifier of the kind to retrieve the subtypes for
        """
        uid = int(uid)
        # Assumes retrieveSubtypes exists on the proxy/client
        result = await aperture_proxy.loadSubtypes(uid)

        if result is None or ('facts' not in result):
            return "No kind with that uid exists or no facts returned"

        related_str = facts_to_related_entities_str(result["facts"])

        ret =  (
            f"\tRelated Entities (uid:name):\n"
            f"{related_str}\n"
        )
        return ret


    async def loadLineage(uid: int)->str:
        """Use this to retrieve the specialization hierarchy of a kind, it's lineage. Provide the uid of the kind, and the system will return a string representation of the hierarchy.
            Args:
                uid: The unique identifier of the kind to retrieve the hierarchy for
        """
        uid = int(uid)
        # Assumes retrieveSpecializationHierarchy exists on the proxy/client
        result = await aperture_proxy.loadSpecializationHierarchy(uid)

        if result is None or ('facts' not in result):
            return "No kind with that uid exists or no facts returned"

        related_str = facts_to_related_entities_str(result["facts"])
        relationships_str = facts_to_relations_str(result["facts"])

        ret =  (
            f"\tRelated Entities (uid:name):\n"
            f"{related_str}\n"
            f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
            f"{relationships_str}"
        )
        return ret


    # --- Classification Operations --- #

    async def loadClassifier(uid: int)->str:
        """Use this to retrieve the classification fact(s) of an individual, the relation relating it to it's type and further knowledge about what it fundamentally is. Provide the uid of the individual, and the system will return a string representation of the classification fact(s).
            Args:
                uid: The unique identifier of the individual to retrieve the classification fact(s) for
        """
        uid = int(uid)
        # Assumes retrieveClassificationFact exists on the proxy/client
        result = await aperture_proxy.loadClassificationFact(uid)

        if result is None or ('facts' not in result):
            return "No individual with that uid exists or no facts returned"

        related_str = facts_to_related_entities_str(result["facts"])
        relationships_str = facts_to_relations_str(result["facts"])

        ret =  (
            f"\tRelated Entities (uid:name):\n"
            f"{related_str}\n"
            f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
            f"{relationships_str}"
        )
        return ret


    async def loadClassified(uid: int)->str:
        """Use this to retrieve the classified entities of a kind, the instances. Provide the uid of the kind, and the system will return a string representation of the classified entities.
            Args:
                uid: The unique identifier of the kind to retrieve the classified entities for
        """
        uid = int(uid)
        # Assumes retrieveClassified exists on the proxy/client
        result = await aperture_proxy.loadClassified(uid)

        if result is None or ('facts' not in result):
            return "No kind with that uid exists or no facts returned"

        related_str = facts_to_related_entities_str(result["facts"])
        relationships_str = facts_to_relations_str(result["facts"])

        ret =  (
            f"\tRelated Entities (uid:name):\n"
            f"{related_str}\n"
            f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
            f"{relationships_str}"
        )
        return ret


    # -- Relation Operations  --- #

    async def loadRelations(uid: int)->str:
        """Use this to retrieve the direct relations an entity is involved in (specialization and classification non inclusive).
        Provide the uid of the kind, and the system will return a string representation of the direct relations.
            Args:
                uid: The unique identifier of the entity to retrieve the relations for
        """
        uid = int(uid)
        result = await aperture_proxy.loadAllRelatedFacts(uid)

        if result is None or ('facts' not in result):
            return "No kind with that uid exists or no facts returned"

        related_str = facts_to_related_entities_str(result["facts"])

        ret =  (
            f"\tRelated Entities (uid:name):\n"
            f"{related_str}\n"
        )
        return ret


    async def loadRoleRequirements(uid: int)->str:
        """Use this to retrieve the role requirements of a relation entity.
        Provide the uid of the relation, and the system will return a string representation of the relations 2 required roles.
            Args:
                uid: The unique identifier of the relation entity to retrieve the role requirements for
        """
        uid = int(uid)
        result = await aperture_proxy.loadRequiredRoles(uid)

        if result is None or ('facts' not in result):
            return "No relation with that uid exists or no facts returned"

        related_str = facts_to_relations_str(result["facts"])

        ret =  (
            f"\tRequired Roles of Relation:\n"
            f"{related_str}\n"
        )
        return ret


    async def loadRolePlayers(uid: int)->str:
        """Use this to retrieve the role players of a relation entity.
        Provide the uid of the relation, and the system will return a string representation of the entities that can play the roles required by the relation.
            Args:
                uid: The unique identifier of the relation entity to retrieve the role players for
        """
        uid = int(uid)
        result = await aperture_proxy.loadRolePlayers(uid)

        if result is None or ('facts' not in result):
            return "No relation with that uid exists or no facts returned"

        related_str = facts_to_relations_str(result["facts"])

        ret =  (
            f"\tRole Players of Relation:\n"
            f"{related_str}\n"
        )
        return ret

     
    # Active Tools --- #

    async def getEntityDefinition(uid: int) -> str | None:
        """Gets textual definition of an entity identified by its UID. Also selects this entity as the current focus."""
        uid = int(uid)
        content = await archivist_proxy.get_definition(uid)
        # if content is None:
        #     return "<<model not yet loaded>>. this is ok. load it using 'loadEntity'"
        await aperture_proxy.selectEntity(uid)
        return '\n'.join(content)  # Correct way to join strings with newlines

    # async def loadEntity(uid: int) -> str:
    #     """Loads detailed information about a specific entity identified by its UID. Returns related entities and relationships."""
    #     uid = int(uid)
    #     result = await aperture_proxy.loadEntity(uid)

    #     if result is None:
    #         return "No entity with that uid exists"

    #     related_str = facts_to_related_entities_str(result["facts"])
    #     relationships_str = facts_to_relations_str(result["facts"])

    #     ret =  (
    #         f"\tRelated Entities (uid:name):\n"
    #         f"{related_str}\n"
    #         f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
    #         f"{relationships_str}"
    #     )

    #     return ret


    # async def getEntityOverview(uid: int)->str | None:
    #     """Gets a high-level overview or representation of an entity identified by its UID. Also selects this entity as the current focus."""
    #     uid = int(uid)

    #     content = semantic_model.getModelRepresentation(uid)

    #     if content is None:
    #         return "<<model not yet loaded>>. this is ok. load it using 'loadEntity'"

    #     await aperture_proxy.selectEntity(uid)

    #     return content


    # async def cutToFinalAnswer(message: str)->str:
    #     """Use this ONLY when you have enough information to provide the final answer. Input the complete final answer string."""
    #     return "cut to the chase"


    # async def getEntityDetails(uid: int)->str:
    #     """Loads detailed information about a specific entity identified by its UID. Returns related entities and relationships."""
    #     uid = int(uid)
    #     result = await aperture_proxy.loadAllRelatedFacts(uid)

    #     if result is None:
    #         return "No entity with that uid exists"

    #     related_str = facts_to_related_entities_str(result["facts"])
    #     relationships_str = facts_to_relations_str(result["facts"])

    #     ret =  (
    #         f"\tRelated Entities (uid:name):\n"
    #         f"{related_str}\n"
    #         f"\tRelationships in the following format ([left hand object uid],[relation type uid],[right hand object uid]):\n"
    #         f"{relationships_str}"
    #     )

    #     return ret


    # Commented Out / Inactive Tools (Preserved) --- #

    #
    # async def specializeKind(name: str)->str:
    #     """Use this to create a new subtype kind from the currently selected entity(kind). Provide the name of the new kind, and the system will create a new kind with that name, and return the uid of the new kind.
    #         Args:
    #             name: The name of the new kind to create
    #     """
    #     # Needs logic to get selected entity, potentially via proxy or agent state
    #     # selected_entity = await aperture_proxy.some_method_to_get_selection() # Example
    #     selected_entity = None # Placeholder
    #     if selected_entity is None:
    #         return "No entity is currently selected (Logic needed)"
    #     # entity_name = semanticModel.models[selected_entity]['name'] # Needs semantic model access
    #     entity_name = "PlaceholderName"
    #     # Assumes specializeKind exists on the proxy/client
    #     result = await aperture_proxy.specializeKind(selected_entity, entity_name, name)
    #
    #     if("error" in result):
    #         return result["error"]
    #
    #     return f"New kind '{name}' created with uid {result['uid']}"

    #
    # async def classifyIndividual(name: str)->str:
    #     """Use this to create a new individual from the currently selected entity(kind). Provide the name of the new individual, and the system will create a new individual with that name, and return the uid of the new individual.
    #         Args:
    #             name: The name of the new individual to create
    #     """
    #     # Needs logic to get selected entity
    #     selected_entity = None # Placeholder
    #     if selected_entity is None:
    #         return "No entity is currently selected (Logic needed)"
    #     # entity_name = semanticModel.models[selected_entity]['name']
    #     entity_name = "PlaceholderName"
    #     # Assumes classifyIndividual exists on the proxy/client
    #     result = await aperture_proxy.classifyIndividual(selected_entity, entity_name, name)
    #
    #     if("error" in result):
    #         return result["error"]
    #
    #     return f"New individual created with uid {result['uid']}"



    # async def findSuitableSupertype(description: str)->str:
    #      """Use this to find a suitable supertype for a new, proposed,  kind...
    #          Args:
    #              description: The name and description of the new kind...
    #      """
    #      # This tool involves complex logic with LLMs and potentially aperture proxy
    #      # Needs selected entity and retrieveSubtypes from proxy
    #      # selected_entity = await aperture_proxy.get_selected_entity() # Example
    #      # subtypes_result = await aperture_proxy.retrieveSubtypes(selected_entity)
    #      # ... rest of the LLM call logic ...
    #      return "Finding suitable supertype (placeholder logic)"

    # Define the list of *active* tool objects created within this scope

    active_tools = [
        # --------------------------------------
        textSearchLoad,
        uidSearchLoad,
        #
        loadDirectSupertypes,
        loadDirectSubtypes,
        loadLineage,
        #
        loadClassifier,
        loadClassified,
        #
        loadRelations,
        loadRoleRequirements,
        loadRolePlayers,
        # loadRolePlayers (of role)
        #
        getEntityDefinition
        ]

    return {
        "tools": active_tools,
    }
