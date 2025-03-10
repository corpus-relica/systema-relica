#!/usr/bin/env python3
import os
from semantic_router import Route
from semantic_router.encoders import OpenAIEncoder
from semantic_router.index.local import LocalIndex
from semantic_router.layer import RouteLayer

class MySemanticRouter:
    def __init__(self):
        self.encoder = OpenAIEncoder()
        self.local_index = LocalIndex()

        # Create two routes to force proper comparison
        self.taxonomic_positioning_query = Route(
            name="taxonomic_positioning_query",
            utterances=[
                    # Direct supertype queries
                    "what do you think a good supertype for a concept \"[X]\" would be?",
                    "what would be a good supertype for a concept \"[X]\"?",
                    "what concept(s) should \"[X]\" be categorized under?",
                    "where in the taxonomy should \"[X]\" be placed?",
                    "what would be an appropriate parent concept for \"[X]\"?",
                    "how should we classify \"[X]\" in our taxonomy?",

                    # Constrained supertype queries
                    "what subtype of concept \"[Y]\" would be a good supertype for a concept \"[X]\"?",
                    "under which subtype of \"[Y]\" should we classify \"[X]\"?",
                    "which subcategory of \"[Y]\" would best contain \"[X]\"?",

                    # Broader taxonomic positioning
                    "help me position \"[X]\" in the taxonomy",
                    "what are the appropriate taxonomic relationships for \"[X]\"?",
                    "how does \"[X]\" fit into our concept hierarchy?",
                    "where should \"[X]\" be placed in relation to other concepts?",

                    # Validation queries
                    "is \"[X]\" appropriately classified as a type of \"[Y]\"?",
                    "does it make sense to categorize \"[X]\" under \"[Y]\"?"
                ],
        )

        # self.general_query = Route(
        #     name="default",
        #     utterances=[
        #         "tell me about the semantic model",
        #         "explain how this works",
        #         "what is a semantic model",
        #         "describe the system",
        #     ]
        # )

        self.routes = [self.taxonomic_positioning_query] #, self.general_query]
        self.route_layer = RouteLayer(
            encoder=self.encoder,
            routes=self.routes,
            index=self.local_index,
            # distance_strategy="cosine"  # Explicitly set distance strategy
        )

    def handle_input(self, user_input: str) -> str:
        """
        Handle user input and return the matched route name or error message.
        """
        user_input = user_input.strip()
        try:
            results = self.route_layer.retrieve_multiple_routes(user_input)
            print(f"\nDebug - Input: '{user_input}'")
            print(f"Debug - Full result: {results}")

            # Take highest scoring route if over threshold, otherwise default
            best_match = max(results, key=lambda x: x.similarity_score)
            print(f"Debug - Best match: {best_match.name}, Score: {best_match.similarity_score}")

            return best_match.name if best_match.similarity_score > 0.8 else "default"

        except Exception as e:
            return "default"

# Create a single instance
semantic_router = MySemanticRouter()
# test_inputs = [
#     "tell me about the semantic model",
#     "what would be a good supertype for concept \"car\"",
#     "help position concept \"vehicle\" in taxonomy"
# ]

# print("########################################################### Semantic Router Test")
# for input_text in test_inputs:
#     print(f"\nTesting: {input_text}")
#     result = semantic_router.handle_input(input_text)
#     print(f"Result: {result}")
# print("END ########################################################### Semantic Router Test")



# If you need to ensure the API key is set
if "OPENAI_API_KEY" not in os.environ:
    raise EnvironmentError("OPENAI_API_KEY environment variable is not set")
