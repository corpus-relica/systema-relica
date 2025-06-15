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
                await self.client.send("archivist.system/heartbeat", {"timestamp": int(asyncio.get_event_loop().time() * 1000)})
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
            logger.debug(f"Raw response from Archivist: {response}")
            
            # More flexible response handling to accommodate changes in Clojure implementation
            
            # Case 1: New standardized response format with success field
            if 'success' in response or ':success' in response:
                success = response.get('success', response.get(':success', False))
                if success:
                    # Success response - return the data field with fallbacks
                    return response.get('data',
                           response.get(':data',
                           response.get('payload',
                           response.get(':payload', {}))))
                else:
                    # Error response - extract error details with flexible key access
                    error = response.get('error', response.get(':error', {}))
                    if isinstance(error, dict):
                        error_message = error.get('message', error.get(':message', 'Unknown error'))
                        error_code = error.get('code', error.get(':code', 0))
                        error_type = error.get('type', error.get(':type', 'error'))
                        error_details = error.get('details', error.get(':details', {}))
                        logger.error(f"Error in response: {error_type} ({error_code}): {error_message}")
                        return {"error": error_message, "code": error_code, "type": error_type, "details": error_details}
                    else:
                        return {"error": str(error)}
            
            # Case 2: Response has direct payload
            for key in ['payload', ':payload', 'data', ':data']:
                if key in response:
                    return response[key]
            
            # Case 3: No structured format found, return the whole response
            return response
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
        return await self._send_message("archivist.graph/query-execute", payload)

    async def resolve_uids(self, uids):
        """Resolve entity UIDs to full entities"""
        return await self._send_message("archivist.entity/batch-resolve", {"uids": uids})

    async def get_kinds(self, opts=None):
        """Get kinds with optional filtering, sorting and pagination"""
        if opts is None:
            opts = {}
        return await self._send_message("archivist.kind/list", opts)

    async def get_collections(self):
        """Get all available entity collections"""
        return await self._send_message("archivist.entity/collections-get", {})

    async def get_entity_type(self, uid):
        """Get the type of an entity"""
        return await self._send_message("archivist.entity/type-get", {"uid": uid})

    async def get_entity_category(self, uid):
        """Get the category of an entity"""
        return await self._send_message("archivist.entity/category-get", {"uid": uid})

    async def text_search(self, query):
        """Perform a text search"""
        return await self._send_message("archivist.search/text", query)

    # Aspect operations
    async def get_aspects(self, opts=None):
        """Get aspects with optional filtering"""
        if opts is None:
            opts = {}
        return await self._send_message("archivist.aspect/list", opts)

    async def create_aspect(self, aspect_data):
        """Create a new aspect"""
        return await self._send_message("archivist.aspect/create", aspect_data)

    async def update_aspect(self, uid, aspect_data):
        """Update an existing aspect"""
        payload = {**aspect_data, "uid": uid}
        return await self._send_message("archivist.aspect/update", payload)

    async def delete_aspect(self, uid):
        """Delete an aspect"""
        return await self._send_message("archivist.aspect/delete", {"uid": uid})

    # Completion operations
    async def get_completions(self, query):
        """Get completions for a query"""
        return await self._send_message("archivist.completion/list", query)

    # Concept operations
    async def get_concept(self, uid):
        """Get a concept by UID"""
        return await self._send_message("archivist.concept/get", {"uid": uid})

    async def create_concept(self, concept_data):
        """Create a new concept"""
        return await self._send_message("archivist.concept/create", concept_data)

    async def update_concept(self, uid, concept_data):
        """Update an existing concept"""
        payload = {**concept_data, "uid": uid}
        return await self._send_message("archivist.concept/update", payload)

    # Definition operations
    async def get_definition(self, uid):
        """Get a definition by UID"""
        return await self._send_message("archivist.definition/get", {"uid": uid})

    async def create_definition(self, def_data):
        """Create a new definition"""
        return await self._send_message("archivist.definition/create", def_data)

    async def update_definition(self, uid, def_data):
        """Update an existing definition"""
        payload = {**def_data, "uid": uid}
        return await self._send_message("archivist.definition/update", payload)

    # Fact operations
    async def get_facts(self, opts=None):
        """Get facts with optional filtering"""
        if opts is None:
            opts = {}
        return await self._send_message("archivist.fact/list", opts)

    async def get_all_related(self, uid):
        """Get all facts related to an entity"""
        return await self._send_message("archivist.fact/all-related-get", {"uid": uid})

    async def create_fact(self, fact_data):
        """Create a new fact"""
        return await self._send_message("archivist.fact/create", fact_data)

    async def update_fact(self, uid, fact_data):
        """Update an existing fact"""
        payload = {**fact_data, "uid": uid}
        return await self._send_message("archivist.fact/update", payload)

    async def delete_fact(self, uid):
        """Delete a fact"""
        return await self._send_message("archivist.fact/delete", {"uid": uid})

    async def get_definitive_facts(self, uid):
        """Get definitive facts about an entity"""
        logger.info(f"Getting definitive facts for uid: {uid}")
        return await self._send_message("archivist.fact/definitive-get", {"uid": uid})

    async def get_facts_relating_entities(self, uid1, uid2):
        """Get facts relating two entities"""
        return await self._send_message("archivist.fact/relating-entities-get", {"uid1": uid1, "uid2": uid2})

    async def get_related_on_uid_subtype_cone(self, lh_object_uid, rel_type_uid):
        """Get related entities based on subtype cone"""
        return await self._send_message("archivist.fact/related-on-uid-subtype-cone-get", {
            "lh-object-uid": lh_object_uid,
            "rel-type-uid": rel_type_uid
        })

    async def get_inherited_relation(self, uid, rel_type_uid):
        """Get inherited relations"""
        return await self._send_message("archivist.fact/inherited-relation-get", {
            "uid": uid,
            "rel-type-uid": rel_type_uid
        })

    async def get_core_sample(self, uid, rel_type_uid):
        """Get core samples for an entity"""
        return await self._send_message("archivist.fact/core-sample-get", {
            "uid": uid,
            "rel-type-uid": rel_type_uid
        })

    async def get_core_sample_rh(self, uid, rel_type_uid):
        """Get right-hand core samples for an entity"""
        return await self._send_message("archivist.fact/core-sample-rh-get", {
            "uid": uid,
            "rel-type-uid": rel_type_uid
        })

    async def get_classification_fact(self, uid):
        """Get classification fact for an entity"""
        return await self._send_message("archivist.fact/classification-get", {"uid": uid})

    async def get_related_to(self, uid, rel_type_uid):
        """Get entities related to an entity"""
        return await self._send_message("archivist.fact/related-to-get", {
            "uid": uid,
            "rel-type-uid": rel_type_uid
        })

    async def get_related_to_subtype_cone(self, uid, rel_type_uid):
        """Get entities related to an entity using subtype cone"""
        return await self._send_message("archivist.fact/related-to-subtype-cone-get", {
            "uid": uid,
            "rel-type-uid": rel_type_uid
        })

    async def get_classified(self, uid):
        """Get entities classified by a kind"""
        return await self._send_message("archivist.fact/classified-get", {"uid": uid})

    async def get_subtypes(self, uid):
        """Get direct subtypes of a kind"""
        return await self._send_message("archivist.fact/subtypes-get", {"uid": uid})

    async def get_subtypes_cone(self, uid):
        """Get all subtypes (cone) of a kind"""
        return await self._send_message("archivist.fact/subtypes-cone-get", {"uid": uid})

    # Individual operations
    async def get_individual(self, uid):
        """Get an individual by UID"""
        return await self._send_message("archivist.individual/get", {"uid": uid})

    async def create_individual(self, individual_data):
        """Create a new individual"""
        return await self._send_message("archivist.individual/create", individual_data)

    async def update_individual(self, uid, individual_data):
        """Update an existing individual"""
        payload = {**individual_data, "uid": uid}
        return await self._send_message("archivist.individual/update", payload)

    # Kind operations
    async def get_kind(self, uid):
        """Get a kind by UID"""
        return await self._send_message("archivist.kind/get", {"uid": uid})

    async def create_kind(self, kind_data):
        """Create a new kind"""
        return await self._send_message("archivist.kind/create", kind_data)

    async def update_kind(self, uid, kind_data):
        """Update an existing kind"""
        payload = {**kind_data, "uid": uid}
        return await self._send_message("archivist.kind/update", payload)

    async def delete_kind(self, uid):
        """Delete a kind"""
        return await self._send_message("archivist.kind/delete", {"uid": uid})

    # Search operations
    async def uid_search(self, query):
        """Search for entities by UID"""
        return await self._send_message("archivist.search/uid", query)

    async def individual_search(self, query):
        """Search for individuals"""
        return await self._send_message("archivist.search/individual", query)

    async def kind_search(self, query):
        """Search for kinds"""
        return await self._send_message("archivist.search/kind", query)

    # Specialization operations
    async def get_specialization_hierarchy(self, user_id, uid):
        """Get specialization hierarchy"""
        return await self._send_message("archivist.specialization/hierarchy-get", {
            "user-id": user_id,
            "uid": uid
        })

    # Transaction operations
    async def get_transaction(self, uid):
        """Get a transaction by UID"""
        return await self._send_message("archivist.transaction/get", {"uid": uid})

    async def create_transaction(self, tx_data):
        """Create a new transaction"""
        return await self._send_message("archivist.transaction/create", tx_data)

    async def commit_transaction(self, uid):
        """Commit a transaction"""
        return await self._send_message("archivist.transaction/commit", {"uid": uid})

    async def rollback_transaction(self, uid):
        """Rollback a transaction"""
        return await self._send_message("archivist.transaction/rollback", {"uid": uid})

    # Validation operations
    async def validate_entity(self, entity_data):
        """Validate an entity"""
        return await self._send_message("archivist.validation/validate", entity_data)

# Create a singleton instance
archivist_client = ArchivistClient()

class ArchivistClientProxy:
    """A proxy class for ArchivistClient that automatically injects user/env context."""
    def __init__(self, user_id, env_id):
        self.user_id = user_id
        self.env_id = env_id
        # Hold a reference to the singleton client
        self._target_client = archivist_client

    async def _proxy_call(self, method_name, *args, **kwargs):
        """Injects context and calls the target client's method."""
        target_method = getattr(self._target_client, method_name)

        # Construct the final arguments by prepending user_id and env_id
        # Note: Not all methods may need both user_id and env_id, but we'll follow
        # the same pattern as ApertureClientProxy for consistency

        # final_args = (self.user_id, self.env_id) + args
        final_args = args
        final_kwargs = kwargs  # Pass kwargs through as is

        logger.debug(f"Proxying call to {method_name} with args: {final_args}, kwargs: {final_kwargs}")
        return await target_method(*final_args, **final_kwargs)

    # --- Connection methods that don't need user context --- #
    
    async def connect(self, *args, **kwargs):
        # Connection doesn't usually need user context, forward directly
        return await self._target_client.connect(*args, **kwargs)

    async def disconnect(self, *args, **kwargs):
        return await self._target_client.disconnect(*args, **kwargs)

    # --- Query and search operations --- #

    async def execute_query(self, *args, **kwargs):
        return await self._proxy_call('execute_query', *args, **kwargs)

    async def resolve_uids(self, *args, **kwargs):
        return await self._proxy_call('resolve_uids', *args, **kwargs)

    async def get_kinds(self, *args, **kwargs):
        return await self._proxy_call('get_kinds', *args, **kwargs)

    async def get_collections(self, *args, **kwargs):
        return await self._proxy_call('get_collections', *args, **kwargs)

    async def get_entity_type(self, *args, **kwargs):
        return await self._proxy_call('get_entity_type', *args, **kwargs)

    async def get_entity_category(self, *args, **kwargs):
        return await self._proxy_call('get_entity_category', *args, **kwargs)

    async def text_search(self, *args, **kwargs):
        return await self._proxy_call('text_search', *args, **kwargs)

    # --- Aspect operations --- #

    async def get_aspects(self, *args, **kwargs):
        return await self._proxy_call('get_aspects', *args, **kwargs)

    async def create_aspect(self, *args, **kwargs):
        return await self._proxy_call('create_aspect', *args, **kwargs)

    async def update_aspect(self, *args, **kwargs):
        return await self._proxy_call('update_aspect', *args, **kwargs)

    async def delete_aspect(self, *args, **kwargs):
        return await self._proxy_call('delete_aspect', *args, **kwargs)

    # --- Completion operations --- #

    async def get_completions(self, *args, **kwargs):
        return await self._proxy_call('get_completions', *args, **kwargs)

    # --- Concept operations --- #

    async def get_concept(self, *args, **kwargs):
        return await self._proxy_call('get_concept', *args, **kwargs)

    async def create_concept(self, *args, **kwargs):
        return await self._proxy_call('create_concept', *args, **kwargs)

    async def update_concept(self, *args, **kwargs):
        return await self._proxy_call('update_concept', *args, **kwargs)

    # --- Definition operations --- #

    async def get_definition(self, *args, **kwargs):
        return await self._proxy_call('get_definition', *args, **kwargs)

    async def create_definition(self, *args, **kwargs):
        return await self._proxy_call('create_definition', *args, **kwargs)

    async def update_definition(self, *args, **kwargs):
        return await self._proxy_call('update_definition', *args, **kwargs)

    # --- Fact operations --- #

    async def get_facts(self, *args, **kwargs):
        return await self._proxy_call('get_facts', *args, **kwargs)

    async def get_all_related(self, *args, **kwargs):
        return await self._proxy_call('get_all_related', *args, **kwargs)

    async def create_fact(self, *args, **kwargs):
        return await self._proxy_call('create_fact', *args, **kwargs)

    async def update_fact(self, *args, **kwargs):
        return await self._proxy_call('update_fact', *args, **kwargs)

    async def delete_fact(self, *args, **kwargs):
        return await self._proxy_call('delete_fact', *args, **kwargs)

    async def get_definitive_facts(self, *args, **kwargs):
        return await self._proxy_call('get_definitive_facts', *args, **kwargs)

    async def get_facts_relating_entities(self, *args, **kwargs):
        return await self._proxy_call('get_facts_relating_entities', *args, **kwargs)

    async def get_related_on_uid_subtype_cone(self, *args, **kwargs):
        return await self._proxy_call('get_related_on_uid_subtype_cone', *args, **kwargs)

    async def get_inherited_relation(self, *args, **kwargs):
        return await self._proxy_call('get_inherited_relation', *args, **kwargs)

    async def get_core_sample(self, *args, **kwargs):
        return await self._proxy_call('get_core_sample', *args, **kwargs)

    async def get_core_sample_rh(self, *args, **kwargs):
        return await self._proxy_call('get_core_sample_rh', *args, **kwargs)

    async def get_classification_fact(self, *args, **kwargs):
        return await self._proxy_call('get_classification_fact', *args, **kwargs)

    async def get_related_to(self, *args, **kwargs):
        return await self._proxy_call('get_related_to', *args, **kwargs)

    async def get_related_to_subtype_cone(self, *args, **kwargs):
        return await self._proxy_call('get_related_to_subtype_cone', *args, **kwargs)

    async def get_classified(self, *args, **kwargs):
        return await self._proxy_call('get_classified', *args, **kwargs)

    async def get_subtypes(self, *args, **kwargs):
        return await self._proxy_call('get_subtypes', *args, **kwargs)

    async def get_subtypes_cone(self, *args, **kwargs):
        return await self._proxy_call('get_subtypes_cone', *args, **kwargs)

    # --- Individual operations --- #

    async def get_individual(self, *args, **kwargs):
        return await self._proxy_call('get_individual', *args, **kwargs)

    async def create_individual(self, *args, **kwargs):
        return await self._proxy_call('create_individual', *args, **kwargs)

    async def update_individual(self, *args, **kwargs):
        return await self._proxy_call('update_individual', *args, **kwargs)

    # --- Kind operations --- #

    async def get_kind(self, *args, **kwargs):
        return await self._proxy_call('get_kind', *args, **kwargs)

    async def create_kind(self, *args, **kwargs):
        return await self._proxy_call('create_kind', *args, **kwargs)

    async def update_kind(self, *args, **kwargs):
        return await self._proxy_call('update_kind', *args, **kwargs)

    async def delete_kind(self, *args, **kwargs):
        return await self._proxy_call('delete_kind', *args, **kwargs)

    # --- Search operations --- #

    async def uid_search(self, *args, **kwargs):
        return await self._proxy_call('uid_search', *args, **kwargs)

    async def individual_search(self, *args, **kwargs):
        return await self._proxy_call('individual_search', *args, **kwargs)

    async def kind_search(self, *args, **kwargs):
        return await self._proxy_call('kind_search', *args, **kwargs)

    # --- Specialization operations --- #

    async def get_specialization_hierarchy(self, *args, **kwargs):
        return await self._proxy_call('get_specialization_hierarchy', *args, **kwargs)

    # --- Transaction operations --- #

    async def get_transaction(self, *args, **kwargs):
        return await self._proxy_call('get_transaction', *args, **kwargs)

    async def create_transaction(self, *args, **kwargs):
        return await self._proxy_call('create_transaction', *args, **kwargs)

    async def commit_transaction(self, *args, **kwargs):
        return await self._proxy_call('commit_transaction', *args, **kwargs)

    async def rollback_transaction(self, *args, **kwargs):
        return await self._proxy_call('rollback_transaction', *args, **kwargs)

    # --- Validation operations --- #

    async def validate_entity(self, *args, **kwargs):
        return await self._proxy_call('validate_entity', *args, **kwargs)

# For testing directly
async def main():
    # Example usage of the proxy
    user_id_test = 123
    env_id_test = 'test-env-proxy'
    proxy_client = ArchivistClientProxy(user_id_test, env_id_test)

    connected = await proxy_client.connect()
    if connected:
        logger.info(f"Proxy connected successfully for user {user_id_test}")

        # Test getting kinds via proxy
        kinds = await proxy_client.get_kinds({"sort": ["name", "ASC"], "range": [0, 10], "filter": {}})
        logger.info(f"Proxy retrieved kinds: {kinds}")

        await proxy_client.disconnect()
        logger.info("Proxy disconnected.")
    else:
        logger.error("Proxy failed to connect.")

# If you want to run this test main:
# if __name__ == "__main__":
#     import asyncio
#     logging.basicConfig(level=logging.INFO)
#     asyncio.run(main())
