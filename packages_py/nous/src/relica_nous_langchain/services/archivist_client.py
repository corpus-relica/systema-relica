#!/usr/bin/env python3

import os
import logging
import asyncio
import edn_format
from dotenv import load_dotenv
from src.meridian.client import WebSocketClient

from src.relica_nous_langchain.SemanticModel import semantic_model

# Setup logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("archivist-client")

# Load environment variables
load_dotenv()
ARCHIVIST_HOST = os.getenv("ARCHIVIST_HOST", "localhost")
ARCHIVIST_PORT = int(os.getenv("ARCHIVIST_PORT", "3000"))
ARCHIVIST_PATH = os.getenv("ARCHIVIST_PATH", "/ws")

class ArchivistClient:
    """
    Client for Archivist service - handles raw tuple access.
    This class mirrors the functionality available in the Clojure ArchivistClient.
    """

    def __init__(self):
        logger.info(f"Initializing Archivist Client for {ARCHIVIST_HOST}:{ARCHIVIST_PORT}")

        # Initialize the WebSocketClient with Archivist service connection details
        self.client = WebSocketClient(
            url=f"ws://{ARCHIVIST_HOST}:{ARCHIVIST_PORT}{ARCHIVIST_PATH}?format=edn&language=python",
            format="edn",  # Use EDN format for Archivist (Clojure backend)
            auto_reconnect=True,
            reconnect_delay=5
        )

        self.connected = False

        # Set up message handlers
        self.setup_message_handlers()
        
        # Start heartbeat scheduler
        self.heartbeat_task = None

    def setup_message_handlers(self):
        """Set up message event handlers"""

        # Setup connection/disconnection handlers
        @self.client.on_message("connect")
        async def on_connect(msg_id, payload):
            logger.info("Connected to Archivist service")
            self.connected = True
            # Start heartbeat when connected
            self.start_heartbeat_scheduler()

        @self.client.on_message("disconnect")
        async def on_disconnect(msg_id, payload):
            logger.info("Disconnected from Archivist service")
            self.connected = False
            # Stop heartbeat when disconnected
            self.stop_heartbeat_scheduler()
            # Try to reconnect after a delay
            await asyncio.sleep(5)
            await self.connect()

    # Connection management
    async def connect(self):
        """Connect to the Archivist service with more verbose error handling"""
        logger.info(f"Connecting to Archivist service at {ARCHIVIST_HOST}:{ARCHIVIST_PORT}")

        # First check if the service is reachable at all
        try:
            # Try a basic socket connection first to see if the port is open
            reader, writer = await asyncio.open_connection(ARCHIVIST_HOST, ARCHIVIST_PORT)
            writer.close()
            await writer.wait_closed()
            logger.info("Basic socket connection to Archivist succeeded")
        except Exception as e:
            logger.error(f"Failed to connect to Archivist service at {ARCHIVIST_HOST}:{ARCHIVIST_PORT}: {e}")
            logger.error("Check if Archivist is running and the port is correct")
            return False

        # Now try the WebSocket connection
        try:
            self.connected = await self.client.connect()

            if self.connected:
                logger.info("Successfully connected to Archivist")
                # Send a simple ping to verify the connection
                try:
                    result = await self.client.send("ping", {"hello": "from-nous"})
                except Exception as e:
                    logger.error(f"Failed to send initial ping: {e}")
            else:
                logger.error("Failed to establish WebSocket connection with Archivist")

            return self.connected

        except Exception as e:
            logger.error(f"Error connecting to Archivist: {e}", exc_info=True)
            self.connected = False
            return False

    async def disconnect(self):
        """Disconnect from the Archivist service"""
        if self.connected and self.client:
            self.stop_heartbeat_scheduler()
            await self.client.disconnect()
            self.connected = False

    # async def send(self, msg_type, payload):
    #     """Send a message to the Archivist service"""
    #     if not self.connected:
    #         logger.warning("Not connected to Archivist, trying to connect...")
    #         await self.connect()
    #         if not self.connected:
    #             return {"error": "Failed to connect to Archivist"}

    #     try:
    #         response = await self.client.send(msg_type, payload)
    #         return response
    #     except Exception as e:
    #         logger.error(f"Error sending message to Archivist: {e}", exc_info=True)
    #         return {"error": f"Failed to send message to Archivist: {str(e)}"}

    # Heartbeat management
    def start_heartbeat_scheduler(self, interval_ms=30000):
        """Start the heartbeat scheduler"""
        if self.heartbeat_task is None or self.heartbeat_task.done():
            self.heartbeat_task = asyncio.create_task(self._heartbeat_loop(interval_ms))
            logger.info("Heartbeat scheduler started")

    def stop_heartbeat_scheduler(self):
        """Stop the heartbeat scheduler"""
        if self.heartbeat_task and not self.heartbeat_task.done():
            self.heartbeat_task.cancel()
            logger.info("Heartbeat scheduler stopped")

    async def _heartbeat_loop(self, interval_ms):
        """Heartbeat loop to keep the connection alive"""
        while self.connected:
            try:
                await self.send_heartbeat()
                await asyncio.sleep(interval_ms / 1000)  # Convert ms to seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in heartbeat loop: {e}")
                await asyncio.sleep(5)  # Wait a bit before retrying

    async def send_heartbeat(self):
        """Send a heartbeat message to the server"""
        logger.info("Sending heartbeat")
        if self.connected:
            try:
                await self.client.send("app/heartbeat", {"timestamp": int(asyncio.get_event_loop().time() * 1000)})
            except Exception as e:
                logger.error(f"Failed to send heartbeat: {e}")

    # Helper method for common message sending pattern
    async def _send_message(self, msg_type, payload, timeout=5000):
        """Send a message to the Archivist service with connection management"""
        if not self.connected:
            logger.warning("Not connected to Archivist, trying to connect...")
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Archivist"}

        try:
            response = await self.client.send(msg_type, payload, timeout)
            return response.get('payload', response)
        except Exception as e:
            logger.error(f"Error sending {msg_type} message to Archivist: {e}", exc_info=True)
            return {"error": f"Failed to send {msg_type} message to Archivist: {str(e)}"}

    # API methods - Equivalent to the Clojure implementation

    # Query and search operations
    async def execute_query(self, query, params=None):
        """Execute a graph query"""
        payload = {"query": query}
        if params:
            payload["params"] = params
        return await self._send_message("graph/execute-query", payload)

    async def resolve_uids(self, uids):
        """Resolve entity UIDs to full entities"""
        return await self._send_message("entities/resolve", {"uids": uids})

    async def get_kinds(self, opts=None):
        """Get kinds with optional filtering, sorting and pagination"""
        if opts is None:
            opts = {}
        return await self._send_message("kinds/get", opts)

    async def get_collections(self):
        """Get all available entity collections"""
        return await self._send_message("entity/collections", {})

    async def get_entity_type(self, uid):
        """Get the type of an entity"""
        return await self._send_message("entity/type", {"uid": uid})

    async def get_entity_category(self, uid):
        """Get the category of an entity"""
        return await self._send_message("entity/category", {"uid": uid})

    async def text_search(self, query):
        """Perform a text search"""
        return await self._send_message("general-search/text", query)

    # Aspect operations
    async def get_aspects(self, opts=None):
        """Get aspects with optional filtering"""
        if opts is None:
            opts = {}
        return await self._send_message("aspects/get", opts)

    async def create_aspect(self, aspect_data):
        """Create a new aspect"""
        return await self._send_message("aspects/create", aspect_data)

    async def update_aspect(self, uid, aspect_data):
        """Update an existing aspect"""
        payload = {**aspect_data, "uid": uid}
        return await self._send_message("aspects/update", payload)

    async def delete_aspect(self, uid):
        """Delete an aspect"""
        return await self._send_message("aspects/delete", {"uid": uid})

    # Completion operations
    async def get_completions(self, query):
        """Get completions for a query"""
        return await self._send_message("completions/get", query)

    # Concept operations
    async def get_concept(self, uid):
        """Get a concept by UID"""
        return await self._send_message("concepts/get", {"uid": uid})

    async def create_concept(self, concept_data):
        """Create a new concept"""
        return await self._send_message("concepts/create", concept_data)

    async def update_concept(self, uid, concept_data):
        """Update an existing concept"""
        payload = {**concept_data, "uid": uid}
        return await self._send_message("concepts/update", payload)

    # Definition operations
    async def get_definition(self, uid):
        """Get a definition by UID"""
        return await self._send_message("definitions/get", {"uid": uid})

    async def create_definition(self, def_data):
        """Create a new definition"""
        return await self._send_message("definitions/create", def_data)

    async def update_definition(self, uid, def_data):
        """Update an existing definition"""
        payload = {**def_data, "uid": uid}
        return await self._send_message("definitions/update", payload)

    # Fact operations
    async def get_facts(self, opts=None):
        """Get facts with optional filtering"""
        if opts is None:
            opts = {}
        return await self._send_message("facts/get", opts)

    async def get_all_related(self, uid):
        """Get all facts related to an entity"""
        return await self._send_message("fact/get-all-related", {"uid": uid})

    async def create_fact(self, fact_data):
        """Create a new fact"""
        return await self._send_message("facts/create", fact_data)

    async def update_fact(self, uid, fact_data):
        """Update an existing fact"""
        payload = {**fact_data, "uid": uid}
        return await self._send_message("facts/update", payload)

    async def delete_fact(self, uid):
        """Delete a fact"""
        return await self._send_message("facts/delete", {"uid": uid})

    async def get_definitive_facts(self, uid):
        """Get definitive facts about an entity"""
        logger.info(f"Getting definitive facts for uid: {uid}")
        return await self._send_message("fact/get-definitive-facts", {"uid": uid})

    async def get_facts_relating_entities(self, uid1, uid2):
        """Get facts relating two entities"""
        return await self._send_message("fact/get-relating-entities", {"uid1": uid1, "uid2": uid2})

    async def get_related_on_uid_subtype_cone(self, lh_object_uid, rel_type_uid):
        """Get related entities based on subtype cone"""
        return await self._send_message("fact/get-related-on-uid-subtype-cone", {
            "lh-object-uid": lh_object_uid,
            "rel-type-uid": rel_type_uid
        })

    async def get_inherited_relation(self, uid, rel_type_uid):
        """Get inherited relations"""
        return await self._send_message("fact/get-inherited-relation", {
            "uid": uid,
            "rel-type-uid": rel_type_uid
        })

    async def get_core_sample(self, uid, rel_type_uid):
        """Get core samples for an entity"""
        return await self._send_message("fact/get-core-sample", {
            "uid": uid,
            "rel-type-uid": rel_type_uid
        })

    async def get_core_sample_rh(self, uid, rel_type_uid):
        """Get right-hand core samples for an entity"""
        return await self._send_message("fact/get-core-sample-rh", {
            "uid": uid,
            "rel-type-uid": rel_type_uid
        })

    async def get_classification_fact(self, uid):
        """Get classification fact for an entity"""
        return await self._send_message("fact/get-classification-fact", {"uid": uid})

    async def get_related_to(self, uid, rel_type_uid):
        """Get entities related to an entity"""
        return await self._send_message("fact/get-related-to", {
            "uid": uid,
            "rel-type-uid": rel_type_uid
        })

    async def get_related_to_subtype_cone(self, uid, rel_type_uid):
        """Get entities related to an entity using subtype cone"""
        return await self._send_message("fact/get-related-to-subtype-cone", {
            "uid": uid,
            "rel-type-uid": rel_type_uid
        })

    async def get_classified(self, uid):
        """Get entities classified by a kind"""
        return await self._send_message("fact/get-classified", {"uid": uid})

    async def get_subtypes(self, uid):
        """Get direct subtypes of a kind"""
        return await self._send_message("fact/get-subtypes", {"uid": uid})

    async def get_subtypes_cone(self, uid):
        """Get all subtypes (cone) of a kind"""
        return await self._send_message("fact/get-subtypes-cone", {"uid": uid})

    # Individual operations
    async def get_individual(self, uid):
        """Get an individual by UID"""
        return await self._send_message("individuals/get", {"uid": uid})

    async def create_individual(self, individual_data):
        """Create a new individual"""
        return await self._send_message("individuals/create", individual_data)

    async def update_individual(self, uid, individual_data):
        """Update an existing individual"""
        payload = {**individual_data, "uid": uid}
        return await self._send_message("individuals/update", payload)

    # Kind operations
    async def get_kind(self, uid):
        """Get a kind by UID"""
        return await self._send_message("kinds/get-one", {"uid": uid})

    async def create_kind(self, kind_data):
        """Create a new kind"""
        return await self._send_message("kinds/create", kind_data)

    async def update_kind(self, uid, kind_data):
        """Update an existing kind"""
        payload = {**kind_data, "uid": uid}
        return await self._send_message("kinds/update", payload)

    async def delete_kind(self, uid):
        """Delete a kind"""
        return await self._send_message("kinds/delete", {"uid": uid})

    # Search operations
    async def uid_search(self, query):
        """Search for entities by UID"""
        return await self._send_message("general-search/uid", query)

    async def individual_search(self, query):
        """Search for individuals"""
        return await self._send_message("individual-search/get", query)

    async def kind_search(self, query):
        """Search for kinds"""
        return await self._send_message("kind-search/get", query)

    # Specialization operations
    async def get_specialization_hierarchy(self, user_id, uid):
        """Get specialization hierarchy"""
        return await self._send_message("specialization/hierarchy", {
            "user-id": user_id,
            "uid": uid
        })

    # Transaction operations
    async def get_transaction(self, uid):
        """Get a transaction by UID"""
        return await self._send_message("transactions/get", {"uid": uid})

    async def create_transaction(self, tx_data):
        """Create a new transaction"""
        return await self._send_message("transactions/create", tx_data)

    async def commit_transaction(self, uid):
        """Commit a transaction"""
        return await self._send_message("transactions/commit", {"uid": uid})

    async def rollback_transaction(self, uid):
        """Rollback a transaction"""
        return await self._send_message("transactions/rollback", {"uid": uid})

    # Validation operations
    async def validate_entity(self, entity_data):
        """Validate an entity"""
        return await self._send_message("validation/validate", entity_data)

# Create a singleton instance
archivist_client = ArchivistClient()

# For testing directly
# async def test_archivist_client():
#     client = ArchivistClient()
#     connected = await client.connect()
#
#     if connected:
#         logger.info("Connection successful!")
#         kinds = await client.get_kinds({"sort": ["name", "ASC"], "range": [0, 10], "filter": {}})
#         logger.info(f"Kinds: {kinds}")
#
#         await client.disconnect()
#     else:
#         logger.error("Failed to connect to Archivist")
