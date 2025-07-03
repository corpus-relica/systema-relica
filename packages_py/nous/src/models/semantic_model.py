# from src.relica_nous_langchain.services.NOUSServer import nous_server


class SemanticModel:
    def __init__(self) -> None:
        self._facts = []
        self._models = {}
        self.selected_entity = None
        pass

    async def loadModelsForFacts(self, facts):
        """
        Load models for all entity UIDs referenced in the provided facts.
        This can be called from both addFact and addFacts methods.

        Args:
            facts: List of fact dictionaries or a single fact dictionary

        Returns:
            None - models are added directly to the semantic model
        """
        # Handle case where a single fact is passed
        if not isinstance(facts, list):
            facts = [facts]

        if not facts:
            return

        # Extract all unique UIDs from the facts
        uids_to_load = set()
        for fact in facts:
            uids_to_load.add(fact["lh_object_uid"])
            uids_to_load.add(fact["rh_object_uid"])

        # Filter out UIDs we already have models for
        uids_to_load = [uid for uid in uids_to_load if uid not in self._models]

        if not uids_to_load:
            return  # No new models to load

        try:
            # Import here to avoid circular imports
            from src.clients.clarity import clarity_client

            # # Call the external API to get the models
            # models_result = await clarity_client.client.retrieveModels(uids_to_load)

            # if models_result and "payload" in models_result:
            #     models_payload = models_result["payload"]
            #     if "models" in models_payload:
            #         models = models_payload["models"]

            #         # Add each model to our store
            #         for model in models:
            #             self.addModel(model)

            #         return models

            # print(f"Failed to load models for UIDs: {uids_to_load}")
            return None

        except Exception as e:
            print(f"Error loading models for facts: {e}")
            return None

    async def removeOrphanedModelsForRemovedFacts(self, removed_fact_uids):
        """
        Remove models that are no longer referenced by any facts after facts are removed.
        This can be called from both removeFact and removeFacts methods.

        Args:
            removed_fact_uids: List of fact UIDs that were removed or a single fact UID

        Returns:
            List of model UIDs that were removed
        """
        # Handle case where a single fact UID is passed
        print("########################")
        print("REMOVING ORPHANED MODELS")
        print("########################")
        print(len(self._models))
        print(removed_fact_uids)

        if not isinstance(removed_fact_uids, list):
            removed_fact_uids = [removed_fact_uids]

        if not removed_fact_uids:
            return []

        print(self._facts)
        # First, collect all the entity UIDs from the removed facts
        removed_facts = [f for f in self._facts if f["fact_uid"] in removed_fact_uids]
        potentially_orphaned_uids = set()
        for fact in removed_facts:
            potentially_orphaned_uids.add(fact["lh_object_uid"])
            potentially_orphaned_uids.add(fact["rh_object_uid"])

        print("########################")
        print("POTENTIALLY ORPHANED MODELS")
        print("########################")

        # # Now remove the facts
        self._facts = [f for f in self._facts if f["fact_uid"] not in removed_fact_uids]

        # Get all UIDs still referenced in the remaining facts
        active_uids = set()
        for f in self._facts:
            active_uids.add(f["lh_object_uid"])
            active_uids.add(f["rh_object_uid"])

        # Find models that are no longer referenced
        orphaned_models = [
            uid
            for uid in potentially_orphaned_uids
            if uid in self._models and uid not in active_uids
        ]

        print("########################")
        print("ORPHANED MODELS")
        print("########################")
        print(len(orphaned_models))

        # Remove orphaned models
        for uid in orphaned_models:
            try:
                self.removeModel(uid)
            except Exception as e:
                print(f"Error removing orphaned model {uid}: {e}")

        print("########################")
        print("REMOVed ORPHANED MODELS")
        print("########################")
        # count of models
        print(len(self._models))

        return orphaned_models

    async def addFact(self, fact):
        # check if the fact is already in the list
        # if it is, remove it first
        self._facts = [f for f in self._facts if f["fact_uid"] != fact["fact_uid"]]
        self._facts.append(fact)
        # await self.removeOrphanedModelsForRemovedFacts(fact['fact_uid'])
        await self.loadModelsForFacts(fact)

    async def addFacts(self, facts):
        # check if the facts are already in the list
        # if they are, remove them first
        factUIDs = [f["fact_uid"] for f in facts]
        self._facts = [f for f in self._facts if f["fact_uid"] not in factUIDs]
        self._facts.extend(facts)
        # await self.removeOrphanedModelsForRemovedFacts(factUIDs)
        await self.loadModelsForFacts(facts)

    async def removeFact(self, factUID):
        await self.removeOrphanedModelsForRemovedFacts(factUID)
        # self._facts = [f for f in self._facts if f['fact_uid'] != factUID]

    async def removeFacts(self, factUIDs):
        await self.removeOrphanedModelsForRemovedFacts(factUIDs)
        # self._facts = [f for f in self._facts if f['fact_uid'] not in factUIDs]

    @property
    def facts(self):
        return self._facts

    @property
    def selectedEntity(self):
        return self.selected_entity

    def hasFactInvolvingUID(self, uid):
        for f in self._facts:
            if uid in [f["lh_object_uid"], f["rh_object_uid"]]:
                return True
        return False

    @property
    def semanticContext(self):
        # selectedNode = nous_server.selectedNode
        return "foo"

    #################################

    def addModel(self, model):
        print("ADDING MODEL")
        print(model)
        # does it even have a uid key?
        if "uid" not in model:
            return
        self._models[model["uid"]] = model

    def addModels(self, models):
        for model in models:
            self.addModel(model)

    def removeModel(self, modelUID):
        del self._models[modelUID]

    @property
    def models(self):
        return self._models

    @property
    def context(self):
        """Generate a comprehensive context representation of the semantic model for the LLM."""
        # Generate metadata about the ontology
        metadata = self.generate_ontology_metadata()

        # Generate entity descriptions
        entity_descriptions = []
        for uid, model in self._models.items():
            entity_descriptions.append(self.format_entity(model))

        # Generate relationships section
        relationships = self.format_relationships()

        # Combine everything into a structured context
        return (
            f"[ONTOLOGY_METADATA]\n{metadata}\n\n"
            f"[ENTITIES]\n" + "\n\n".join(entity_descriptions) + "\n\n"
            f"[RELATIONSHIPS]\n{relationships}\n"
        )

    def generate_ontology_metadata(self):
        """Generate metadata about the ontology."""
        # Count entities by type
        kinds_count = sum(1 for m in self._models.values() if m.get("type") == "kind")
        individuals_count = sum(
            1 for m in self._models.values() if m.get("type") == "individual"
        )

        # Get unique categories if available
        categories = set()
        for model in self._models.values():
            category = model.get("category")
            if category:
                categories.add(category)

        # Format metadata
        return (
            f"TOTAL ENTITIES: {len(self._models)}\n"
            f"KINDS: {kinds_count}\n"
            f"INDIVIDUALS: {individuals_count}\n"
            f"ENTITY TYPES: {', '.join(categories) if categories else 'Not specified'}\n"
            f"FACTS COUNT: {len(self._facts)}\n"
            f"SELECTED ENTITY: {self.selected_entity if self.selected_entity else 'None'}"
        )

    def format_entity(self, model):
        print(
            "/////////////////////////////// FORMATTING ENTITY ///////////////////////////////"
        )
        print(model)

        """Format an entity based on its type and properties."""
        uid = model.get("uid")
        name = model.get("name", "Unnamed")
        entity_type = model.get("nature", "unknown")
        category = model.get("category", "unspecified")

        # Base entity template
        result = f"[ENTITY: {uid}]\nNAME: {name}\nTYPE: {entity_type}"

        # Add category if available
        if category:
            result += f" {category}"

        # Add definitions or classifiers based on type
        if entity_type == "kind":
            definitions = []
            if "definition" in model:
                for def_item in model["definition"]:
                    supertype = def_item.get("supertype_name", "unknown")
                    definition = def_item.get("full_definition", "")
                    definitions.append(f'- "{definition}" (supertype: {supertype})')

            result += "\nDEFINITIONS:\n" + "\n".join(definitions)

            # Add role information if available
            if "requiring_kinds_of_relations" in model:
                relations = model.get("requiring_kinds_of_relations", [])
                result += f"\nUSED IN RELATIONS: {', '.join(str(r) for r in relations)}"

            if "possible_kinds_of_role_players" in model:
                players = model.get("possible_kinds_of_role_players", [])
                result += f"\nCAN BE PLAYED BY: {', '.join(str(p) for p in players)}"

        elif entity_type == "individual":
            classifiers = model.get("classifiers", [])
            result += f"\nCLASSIFIED AS: {', '.join(str(c) for c in classifiers)}"

            # Add aspects if any
            if "aspects" in model:
                aspects = []
                for aspect in model["aspects"]:
                    aspect_name = aspect.get("name", "Unnamed aspect")
                    aspect_value = aspect.get("value", "No value")
                    aspects.append(f"- {aspect_name}: {aspect_value}")

                if aspects:
                    result += "\nASPECTS:\n" + "\n".join(aspects)

        # Add specialized templates based on category
        if category == "relation":
            if entity_type == "kind":
                role1 = model.get("required_kind_of_role_1", "unknown")
                role2 = model.get("required_kind_of_role_2", "unknown")
                result += f"\nROLE 1: {role1}\nROLE 2: {role2}"
            elif entity_type == "individual":
                lh_object = self.get_entity_name(model.get("lh_object", "unknown"))
                rh_object = self.get_entity_name(model.get("rh_object", "unknown"))
                result += f"\nLEFT OBJECT: {lh_object}\nRIGHT OBJECT: {rh_object}"

        elif category == "occurrence":
            occurrence_type = model.get("occurrence_type", "unknown")
            result += f"\nOCCURRENCE TYPE: {occurrence_type}"

            if entity_type == "individual":
                # Add temporal information if available
                if "happens_during" in model:
                    result += f"\nHAPPENED DURING: {model['happens_during']}"

                # Add involvements if available
                if "involvements" in model:
                    involvements = []
                    for inv_tuple in model["involvements"]:
                        inv, involved = inv_tuple
                        inv_name = self.get_entity_name(inv)
                        involved_name = self.get_entity_name(involved)
                        involvements.append(f"- {involved_name} as {inv_name}")

                    if involvements:
                        result += "\nINVOLVED:\n" + "\n".join(involvements)

        # Add facts related to this entity
        entity_facts = self.get_facts_for_entity(uid)
        if entity_facts:
            result += "\nRELATED FACTS:\n"
            result += self.facts_to_categorized_facts_str(entity_facts)

        print(result)
        print(
            "/////////////////////////////// DONE FORMATTING ENTITY ///////////////////////////////"
        )
        return result

    def get_entity_name(self, uid):
        """Get entity name from UID, providing a placeholder if not found."""
        if uid in self._models:
            return self._models[uid].get("name", f"Entity {uid}")
        else:
            return f"Unknown entity {uid}"

    def get_facts_for_entity(self, uid):
        """Get all facts that involve a specific entity."""
        return [
            f
            for f in self._facts
            if uid in [f.get("lh_object_uid"), f.get("rh_object_uid")]
        ]

    def format_relationships(self):
        """Format relationships in a natural language style."""
        relationship_lines = []

        # Group facts by relation type for better organization
        rel_types = {}
        for fact in self._facts:
            rel_type = fact.get("rel_type_name", "unknown relation")
            if rel_type not in rel_types:
                rel_types[rel_type] = []

            lh_name = fact.get("lh_object_name", f"Entity {fact.get('lh_object_uid')}")
            lh_uid = fact.get("lh_object_uid")
            rh_name = fact.get("rh_object_name", f"Entity {fact.get('rh_object_uid')}")
            rh_uid = fact.get("rh_object_uid")

            rel_types[rel_type].append(
                f"- {lh_name}({lh_uid}) -> {rel_type} -> {rh_name}({rh_uid})"
            )

        # Add each relation type group
        for rel_type, lines in rel_types.items():
            # relationship_lines.append(f"{rel_type.upper()}:")
            relationship_lines.extend(lines)
            # relationship_lines.append("")  # Empty line for spacing

        return "\n".join(relationship_lines)

    def getModelRepresentation(self, uid):
        """Get a detailed representation of a specific model."""
        if uid not in self._models:
            return "No specific entity selected\n"

        model = self._models[uid]
        return self.format_entity(model)

    # def facts_to_related_entities_str(self, facts) -> str:
    #     uidTermMap = {
    #         f['lh_object_uid']: f['lh_object_name']
    #         for f in facts
    #     }
    #     uidTermMap.update({
    #         f['rh_object_uid']: f['rh_object_name']
    #         for f in facts
    #     })
    #     return "\n".join(f"{uid}: {term}" for uid, term in uidTermMap.items())

    # def facts_to_relations_str(self, facts) -> str:
    #     uidTermMap = {
    #         f['rel_type_uid']: f['rel_type_name']
    #         for f in facts
    #     }
    #     return "\n".join(f"{uid}: {term}" for uid, term in uidTermMap.items())

    # def facts_to_str(self, facts) -> str:
    #     return "\n".join(
    #         f"{f['lh_object_name']} -> {f['rel_type_name']} -> {f['rh_object_name']}"
    #         for f in facts
    #     )

    def facts_to_categorized_facts_str(self, facts) -> str:
        # Group facts by relationship type
        grouped_facts = {}
        for f in facts:
            rel_type = f["rel_type_uid"]
            if rel_type not in grouped_facts:
                grouped_facts[rel_type] = []
            grouped_facts[rel_type].append(f)

        # Build string with categorized facts
        result = ""
        for rel_type, fact_group in grouped_facts.items():
            facts_str = "\n".join(
                f"{f['lh_object_name']} -> {f['rel_type_name']} -> {f['rh_object_name']}"
                for f in fact_group
            )
            result += f"# {rel_type}:\n{facts_str}\n"
        return result.rstrip()

    # def facts_to_taxonomy_str(self, facts) -> str:
    #         # # Extract and format taxonomic relationships
    #         # taxonomy_facts = [f for f in facts if 'specialization' in f['rel_type_name'].lower()]
    #         # return " -> ".join(f"{f['lh_object_name']}[{f['lh_object_uid']}]" for f in taxonomy_facts)
    #     return ""

    # def getModel(self, uid):
    #     return self._models[uid]

    # def getModelRepresentation(self, uid):
    #     if uid not in self._models:
    #         return "no specific entity selected\n"
    #     m = self._models[uid]
    #     if(m['type'] == 'kind'):
    #         return self.getKindModelRepresentation(uid)
    #     elif(m['type'] == 'individual'):
    #         return self.getIndividualModelRepresentation(uid)
    #     definition = m['definition'][0]['full_definition']
    #     modelStr =  (
    #         f"KIND[{uid}]\n"
    #         f"NAME: {m['facts'][0]['lh_object_name']}\n"
    #         f"DEF: {definition}\n\n"
    #         f"ENTITIES:\n"
    #         f"{self.facts_to_related_entities_str(m['facts'])}\n\n"
    #         f"RELATIONS:\n"
    #         f"{self.facts_to_relations_str(m['facts'])}\n\n"
    #         f"FACTS:\n"
    #         f"{self.facts_to_str(m['facts'])}\n"
    #     )
    #     return modelStr

    # def getModelName(self, uid):
    #     return self._models[uid]['name']

    # def getIndividualModelRepresentation(self, uid):
    #     if uid not in self._models:
    #         return None
    #     m = self._models[uid]
    #     definition = m['definition'][0]['full_definition']

    #     # For individuals, organize by aspects of their existence
    #     return (
    #         f"INDIVIDUAL[{uid}]\n"
    #         f"NAME: {m['facts'][0]['lh_object_name']}\n"  # Assuming first fact has the name
    #         f"DEF: {definition}\n\n"
    #         f"ENTITIES:\n"
    #         f"{self.facts_to_related_entities_str(m['facts'])}\n\n"
    #         f"RELATIONS:\n"
    #         f"{self.facts_to_relations_str(m['facts'])}\n\n"
    #         f"FACTS:\n"
    #         f"{self.facts_to_categorized_facts_str(m['facts'])}\n"
    #     )

    # def getKindModelRepresentation(self, uid):
    #     if uid not in self._models:
    #         return None
    #     m = self._models[uid]
    #     definition = m['definition'][0]['full_definition']

    #     # For kinds, emphasize taxonomic and definitional relationships
    #     return (
    #         f"KIND[{uid}]\n"
    #         f"NAME: {m['facts'][0]['lh_object_name']}\n"
    #         f"DEF: {definition}\n\n"
    #         # f"TAXONOMY:\n"
    #         # f"{self.facts_to_taxonomy_str(m['facts'])}\n\n"
    #         # f"PROPERTIES:\n"
    #         # f"{self.facts_to_properties_str(m['facts'])}\n\n"
    #         f"ENTITIES:\n"
    #         f"{self.facts_to_related_entities_str(m['facts'])}\n\n"
    #         f"RELATIONS:\n"
    #         f"{self.facts_to_relations_str(m['facts'])}\n\n"
    #         f"FACTS:\n"
    #         f"{self.facts_to_str(m['facts'])}\n"
    #     )


semantic_model = SemanticModel()
