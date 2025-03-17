# from src.relica_nous_langchain.services.NOUSServer import nous_server

class SemanticModel:
    def __init__(self) -> None:
        self._facts = []
        self._models = {}
        self.selected_entity = None
        pass

    def addFact(self, fact):
        self._facts.append(fact)

    def addFacts(self, facts):
        self._facts.extend(facts)

    def removeFact(self, factUID):
        self._facts = [f for f in self._facts if f['fact_uid'] != factUID]

    def removeFacts(self, factUIDs):
        self._facts = [f for f in self._facts if f['fact_uid'] not in factUIDs]

    @property
    def facts(self):
        return self._facts

    def hasFactInvolvingUID(self, uid):
        for f in self._facts:
            if uid in [f['lh_object_uid'], f['rh_object_uid']]:
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
        if 'uid' not in model:
            return
        self._models[model['uid']] = model

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
        return (
            f"<related_entities>\n"
            f"{self.facts_to_related_entities_str(self.facts)}\n"
            f"</related_entities>\n"
            f"<relationships>\n"
            f"{self.facts_to_relations_str(self.facts)}"
            f"</relationships>\n"
            f"<facts>\n"
            f"{self.facts_to_str(self.facts)}\n"
            f"</facts>\n"
        )


    def facts_to_related_entities_str(self, facts) -> str:
        uidTermMap = {
            f['lh_object_uid']: f['lh_object_name']
            for f in facts
        }
        uidTermMap.update({
            f['rh_object_uid']: f['rh_object_name']
            for f in facts
        })
        return "\n".join(f"{uid}: {term}" for uid, term in uidTermMap.items())


    def facts_to_relations_str(self, facts) -> str:
        uidTermMap = {
            f['rel_type_uid']: f['rel_type_name']
            for f in facts
        }
        return "\n".join(f"{uid}: {term}" for uid, term in uidTermMap.items())


    def facts_to_str(self, facts) -> str:
        return "\n".join(
            f"{f['lh_object_name']} -> {f['rel_type_name']} -> {f['rh_object_name']}"
            for f in facts
        )


    def facts_to_categorized_facts_str(self, facts) -> str:
        # Group facts by relationship type
        grouped_facts = {}
        for f in facts:
            rel_type = f['rel_type_name']
            if rel_type not in grouped_facts:
                grouped_facts[rel_type] = []
            grouped_facts[rel_type].append(f)

        # Build string with categorized facts
        result = ""
        for rel_type, fact_group in grouped_facts.items():
            facts_str = "\n".join(
                f"{f['lh_object_name']} -> {f['rh_object_name']}"
                for f in fact_group
            )
            result += f"# {rel_type}:\n{facts_str}\n"
        return result.rstrip()


    def facts_to_taxonomy_str(self, facts) -> str:
            # # Extract and format taxonomic relationships
            # taxonomy_facts = [f for f in facts if 'specialization' in f['rel_type_name'].lower()]
            # return " -> ".join(f"{f['lh_object_name']}[{f['lh_object_uid']}]" for f in taxonomy_facts)
        return ""


    def getModel(self, uid):
        return self._models[uid]


    def getModelRepresentation(self, uid):
        if uid not in self._models:
            return "no specific entity selected\n"
        m = self._models[uid]
        if(m['type'] == 'kind'):
            return self.getKindModelRepresentation(uid)
        elif(m['type'] == 'individual'):
            return self.getIndividualModelRepresentation(uid)
        definition = m['definition'][0]['full_definition']
        modelStr =  (
            f"KIND[{uid}]\n"
            f"NAME: {m['facts'][0]['lh_object_name']}\n"
            f"DEF: {definition}\n\n"
            f"ENTITIES:\n"
            f"{self.facts_to_related_entities_str(m['facts'])}\n\n"
            f"RELATIONS:\n"
            f"{self.facts_to_relations_str(m['facts'])}\n\n"
            f"FACTS:\n"
            f"{self.facts_to_str(m['facts'])}\n"
        )
        return modelStr


    def getModelName(self, uid):
        return self._models[uid]['name']


    def getIndividualModelRepresentation(self, uid):
        if uid not in self._models:
            return None
        m = self._models[uid]
        definition = m['definition'][0]['full_definition']

        # For individuals, organize by aspects of their existence
        return (
            f"INDIVIDUAL[{uid}]\n"
            f"NAME: {m['facts'][0]['lh_object_name']}\n"  # Assuming first fact has the name
            f"DEF: {definition}\n\n"
            f"ENTITIES:\n"
            f"{self.facts_to_related_entities_str(m['facts'])}\n\n"
            f"RELATIONS:\n"
            f"{self.facts_to_relations_str(m['facts'])}\n\n"
            f"FACTS:\n"
            f"{self.facts_to_categorized_facts_str(m['facts'])}\n"
        )


    def getKindModelRepresentation(self, uid):
        if uid not in self._models:
            return None
        m = self._models[uid]
        definition = m['definition'][0]['full_definition']

        # For kinds, emphasize taxonomic and definitional relationships
        return (
            f"KIND[{uid}]\n"
            f"NAME: {m['facts'][0]['lh_object_name']}\n"
            f"DEF: {definition}\n\n"
            # f"TAXONOMY:\n"
            # f"{self.facts_to_taxonomy_str(m['facts'])}\n\n"
            # f"PROPERTIES:\n"
            # f"{self.facts_to_properties_str(m['facts'])}\n\n"
            f"ENTITIES:\n"
            f"{self.facts_to_related_entities_str(m['facts'])}\n\n"
            f"RELATIONS:\n"
            f"{self.facts_to_relations_str(m['facts'])}\n\n"
            f"FACTS:\n"
            f"{self.facts_to_str(m['facts'])}\n"
        )


semantic_model = SemanticModel()
