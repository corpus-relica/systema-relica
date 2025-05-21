#!/usr/bin/env python3

import os
import logging
import asyncio
import edn_format
import functools
from dotenv import load_dotenv
from src.meridian.client import WebSocketClient
from src.relica_nous_langchain.SemanticModel import semantic_model

# Setup logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("aperture-client")

# Load environment variables
load_dotenv()
APERTURE_HOST = os.getenv("APERTURE_HOST", "localhost")
APERTURE_PORT = int(os.getenv("APERTURE_PORT", "2175"))
APERTURE_PATH = os.getenv("APERTURE_PATH", "/ws")

class ApertureClient:
    """
    Client for Aperture service - handles session management and environment functions.
    This class mirrors the functionality available in the Clojure ApertureClient.
    """

    def __init__(self):
        logger.info(f"Initializing Aperture Client for {APERTURE_HOST}:{APERTURE_PORT}")

        # Initialize the WebSocketClient with Aperture service connection details
        self.client = WebSocketClient(
            url=f"ws://{APERTURE_HOST}:{APERTURE_PORT}{APERTURE_PATH}?format=edn&language=python",
            format="edn",  # Use EDN format for Aperture (Clojure backend)
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
            logger.info("Connected to Aperture service")
            self.connected = True
            # Start heartbeat when connected
            self.start_heartbeat_scheduler()

        @self.client.on_message("disconnect")
        async def on_disconnect(msg_id, payload):
            logger.info("Disconnected from Aperture service")
            self.connected = False
            # Stop heartbeat when disconnected
            self.stop_heartbeat_scheduler()
            # Try to reconnect after a delay
            await asyncio.sleep(5)
            await self.connect()

        @self.client.on_message("aperture.facts/loaded")
        async def on_facts_loaded(msg_id, payload):
            logger.info("Facts loaded")
            await semantic_model.addFacts(payload['facts'])
            return payload

        @self.client.on_message("aperture.facts/unloaded")
        async def on_facts_unloaded(msg_id, payload):
            logger.info("Facts unloaded")
            await semantic_model.removeFacts(payload['fact-uids'])
            return payload

        @self.client.on_message("aperture.entity/selected")
        async def on_entity_selected(msg_id, payload):
            logger.info("Entity selected")
            logger.info(f"Selected entity: {payload['entity-uid']}")
            semantic_model.selected_entity = payload['entity-uid']
            # emit event
            return payload

        @self.client.on_message("aperture.entity/deselected")
        async def on_entity_deselected(msg_id, payload):
            logger.info("Entity deselected")
            semantic_model.selected_entity = None
            # emit event
            return payload

    # Connection management
    async def connect(self):
        """Connect to the Aperture service with more verbose error handling"""
        logger.info(f"Connecting to Aperture service at {APERTURE_HOST}:{APERTURE_PORT}")

        # First check if the service is reachable at all
        try:
            # Try a basic socket connection first to see if the port is open
            reader, writer = await asyncio.open_connection(APERTURE_HOST, APERTURE_PORT)
            writer.close()
            await writer.wait_closed()
            logger.info("Basic socket connection to Aperture succeeded")
        except Exception as e:
            logger.error(f"Failed to connect to Aperture service at {APERTURE_HOST}:{APERTURE_PORT}: {e}")
            logger.error("Check if Aperture is running and the port is correct")
            return False

        # Now try the WebSocket connection
        try:
            self.connected = await self.client.connect()

            if self.connected:
                logger.info("Successfully connected to Aperture")
                # Send a simple ping to verify the connection
                try:
                    result = await self.client.send("ping", {"hello": "from-nous"})
                    logger.info(f"!!!!!!!!!!!!!!!!!!!!!! Ping result: {result}")
                except Exception as e:
                    logger.error(f"Failed to send initial ping: {e}")
            else:
                logger.error("Failed to establish WebSocket connection with Aperture")

            return self.connected

        except Exception as e:
            logger.error(f"Error connecting to Aperture: {e}", exc_info=True)
            self.connected = False
            return False

    async def disconnect(self):
        """Disconnect from the Aperture service"""
        if self.connected and self.client:
            self.stop_heartbeat_scheduler()
            await self.client.disconnect()
            self.connected = False

    # async def send(self, msg_type, payload):
    #     """Send a message to the Aperture service"""
    #     if not self.connected:
    #         logger.warning("Not connected to Aperture, trying to connect...")
    #         await self.connect()
    #         if not self.connected:
    #             return {"error": "Failed to connect to Aperture"}

    #     try:
    #         response = await self.client.send(msg_type, payload)
    #         return response
    #     except Exception as e:
    #         logger.error(f"Error sending message to Aperture: {e}", exc_info=True)
    #         return {"error": f"Failed to send message to Aperture: {str(e)}"}

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
                await self.client.send("relica.app/heartbeat", {"timestamp": int(asyncio.get_event_loop().time() * 1000)})
            except Exception as e:
                logger.error(f"Failed to send heartbeat: {e}")

    # Helper method to ensure connection and handle errors
    async def _ensure_connection(self):
        """Ensure connection to Aperture service"""
        if not self.connected:
            logger.warning("Not connected to Aperture, trying to connect...")
            await self.connect()
            if not self.connected:
                return False
        return True
    
    # Helper method to process response
    def _process_response(self, response):
        """Process response from Aperture service to extract payload"""
        if isinstance(response, dict):
            # Try different ways the payload might be structured
            for key in ['payload', ':payload', 'data', ':data', 'environment', ':environment']:
                if key in response:
                    return response[key]
        # If no recognized structure, return the whole response
        return response
    
    # Decorator for API methods
    def aperture_api_call(operation_name):
        """Decorator for Aperture API calls to handle connection and errors"""
        def decorator(func):
            @functools.wraps(func)
            async def wrapper(self, *args, **kwargs):
                # Ensure connection
                if not await self._ensure_connection():
                    return {"error": "Failed to connect to Aperture"}
                
                try:
                    # Call the original function
                    response = await func(self, *args, **kwargs)
                    # Process the response
                    return self._process_response(response)
                except Exception as e:
                    logger.error(f"Error {operation_name}: {e}", exc_info=True)
                    return {"error": f"Failed to {operation_name}: {str(e)}"}
            return wrapper
        return decorator
    
    # API methods - Equivalent to the Clojure implementation
    @aperture_api_call("retrieve environment")
    async def retrieveEnvironment(self, user_id, environment_id=None):
        """Retrieve the current environment state (equivalent to get-environment)"""
        logger.info(f"Retrieving environment for user {user_id}")
        
        # Create the payload
        payload = {"user-id": user_id}
        if environment_id is not None:
            payload["environment-id"] = environment_id

        logger.info(f"Sending environment/get request with payload: {payload}")
        response = await self.client.send("aperture.environment/get", payload)
        logger.info(f"Received environment response: {response}")
        
        return response

    @aperture_api_call("list environments")
    async def listEnvironments(self, user_id):
        """List all environments for a user (equivalent to list-environments)"""
        return await self.client.send("aperture.environment/list", {"user-id": user_id})

    @aperture_api_call("create environment")
    async def createEnvironment(self, user_id, env_name):
        """Create a new environment (equivalent to create-environment)"""
        return await self.client.send("aperture.environment/create", {
            "user-id": user_id,
            "name": env_name
        })

    @aperture_api_call("load specialization fact")
    async def loadSpecializationFact(self, user_id, env_id, uid):
        """Load specialization fact"""
        return await self.client.send("aperture.specialization/load-fact", {
            "user-id": user_id,
            "environment-id": env_id,
            "uid": uid
        })

    @aperture_api_call("load specialization hierarchy")
    async def loadSpecializationHierarchy(self, user_id, env_id, uid):
        """Load specialization hierarchy (equivalent to load-specialization-hierarchy)"""
        return await self.client.send("aperture.specialization/load", {
            "user-id": user_id,
            "environment-id": env_id,
            "uid": uid
        })

    @aperture_api_call("clear environment entities")
    async def clearEnvironmentEntities(self, user_id, env_id):
        """Clear all entities from an environment (equivalent to clear-environment-entities)"""
        return await self.client.send("aperture.environment/clear", {
            "user-id": user_id,
            "environment-id": env_id
        })

    @aperture_api_call("load all related facts")
    async def loadAllRelatedFacts(self, user_id, env_id, entity_uid):
        """Load all facts related to an entity (equivalent to load-all-related-facts)"""
        return await self.client.send("aperture.fact/load-related", {
            "user-id": user_id,
            "environment-id": env_id,
            "entity-uid": entity_uid
        })

    @aperture_api_call("unload entity")
    async def unloadEntity(self, user_id, env_id, entity_uid):
        """Unload an entity from the environment (equivalent to unload-entity)"""
        return await self.client.send("aperture.entity/unload", {
            "user-id": user_id,
            "environment-id": env_id,
            "entity-uid": entity_uid
        })

    @aperture_api_call("load entities")
    async def loadEntities(self, user_id, env_id, entity_uids):
        """Load multiple entities (equivalent to load-entities)"""
        return await self.client.send("aperture.entity/load-multiple", {
            "user-id": user_id,
            "environment-id": env_id,
            "entity-uids": entity_uids
        })

    @aperture_api_call("load subtypes")
    async def loadSubtypes(self, user_id, env_id, entity_uid):
        """Load subtypes"""
        return await self.client.send("aperture.subtype/load", {
            "user-id": user_id,
            "environment-id": env_id,
            "entity-uid": entity_uid
        })

    @aperture_api_call("load classified")
    async def loadClassified(self, user_id, env_id, entity_uid):
        """Load classified"""
        return await self.client.send("aperture.classification/load", {
            "user-id": user_id,
            "environment-id": env_id,
            "entity-uid": entity_uid
        })

    @aperture_api_call("load classification fact")
    async def loadClassificationFact(self, user_id, env_id, entity_uid):
        """Load classificationFact"""
        return await self.client.send("aperture.classification/load-fact", {
            "user-id": user_id,
            "environment-id": env_id,
            "entity-uid": entity_uid
        })

    @aperture_api_call("load subtypes cone")
    async def loadSubtypesCone(self, user_id, env_id, entity_uid):
        """Load subtypes cone (equivalent to load-subtypes-cone)"""
        return await self.client.send("aperture.subtype/load-cone", {
            "user-id": user_id,
            "environment-id": env_id,
            "entity-uid": entity_uid
        })

    @aperture_api_call("unload entities")
    async def unloadEntities(self, user_id, env_id, entity_uids):
        """Unload multiple entities (equivalent to unload-entities)"""
        return await self.client.send("aperture.entity/unload-multiple", {
            "user-id": user_id,
            "environment-id": env_id,
            "entity-uids": entity_uids
        })

    @aperture_api_call("update environment")
    async def updateEnvironment(self, user_id, env_id, updates):
        """Update environment (equivalent to update-environment!)"""
        return await self.client.send("environment/update", {
            "user-id": user_id,
            "environment-id": env_id,
            "updates": updates
        })

    @aperture_api_call("select entity")
    async def selectEntity(self, user_id, env_id, entity_uid):
        """Select an entity (equivalent to select-entity)"""
        return await self.client.send("aperture.entity/select", {
            "user-id": user_id,
            "environment-id": env_id,
            "entity-uid": entity_uid
        })

    @aperture_api_call("deselect entities")
    async def selectEntityNone(self, user_id, env_id):
        """Deselect all entities (equivalent to select-entity-none)"""
        return await self.client.send("aperture.entity/deselect", {
            "user-id": user_id,
            "environment-id": env_id
        })

    # Existing methods
    @aperture_api_call("load entity")
    async def loadEntity(self, user_id, env_id, uid):
        """Load entity data by UID"""
        return await self.client.send("environment/load-entity", {
            "entity-uid": uid,
            "user-id": user_id,
            "environment-id": env_id
        })

    @aperture_api_call("text search load")
    async def textSearchLoad(self, user_id, env_id, term):
        """Load entity data by text search term"""
        response = await self.client.send("aperture.search/load-text", {
            "user-id": user_id,
            "environment-id": env_id,
            "term": term
        })
        print("//////////////////////////////// TEXT SEARCH LOAD RESPONSE ////////////////////////////////")
        print(response)
        return response

    @aperture_api_call("uid search load")
    async def uidSearchLoad(self, user_id, env_id, uid):
        """Load entity data by numerical search uid"""
        response = await self.client.send("aperture.search/load-uid", {
            "user-id": user_id,
            "environment-id": env_id,
            "uid": uid
        })
        print("//////////////////////////////// UID SEARCH LOAD RESPONSE ////////////////////////////////")
        print(response)
        return response

    @aperture_api_call("load_required_roles")
    async def loadRequiredRoles(self, user_id, env_id, uid):
        """Load required roles of relation"""
        response = await self.client.send("aperture.relation/required-roles-load", {
            "user-id": user_id,
            "environment-id": env_id,
            "uid": uid
        })
        return response

    @aperture_api_call("load_role_players")
    async def loadRolePlayers(self, user_id, env_id, uid):
        """Load role players of relation"""
        response = await self.client.send("aperture.relation/role-players-load", {
            "user-id": user_id,
            "environment-id": env_id,
            "uid": uid
        })
        return response

    @aperture_api_call("emit event")
    async def emit(self, target, event_type, payload):
        """Emit an event (used in the textSearchLoad method)"""
        return await self.client.send(f"{target}/{event_type}", payload)

# Create a singleton instance
aperture_client = ApertureClient()

class ApertureClientProxy:
    """A proxy class for ApertureClient that automatically injects user/env context."""
    def __init__(self, user_id, env_id):
        self.user_id = user_id
        self.env_id = env_id
        # Hold a reference to the singleton client
        self._target_client = aperture_client

    async def _proxy_call(self, method_name, *args, **kwargs):
        """Injects context and calls the target client's method."""
        target_method = getattr(self._target_client, method_name)

        # --- Corrected Argument Injection --- 
        # Assume target methods requiring context expect (user_id, env_id, ...actual_args)
        # Construct the final arguments by prepending user_id and env_id
        final_args = (self.user_id, self.env_id) + args
        final_kwargs = kwargs # Pass kwargs through as is

        logger.debug(f"Proxying call to {method_name} with args: {final_args}, kwargs: {final_kwargs}")
        return await target_method(*final_args, **final_kwargs)

    # --- Define proxy methods for each ApertureClient method --- #
    # --- We need to explicitly define each one to maintain async/await --- #

    async def connect(self, *args, **kwargs):
        # Connection doesn't usually need user context, forward directly
        return await self._target_client.connect(*args, **kwargs)

    async def disconnect(self, *args, **kwargs):
        return await self._target_client.disconnect(*args, **kwargs)

    # --

    async def retrieveEnvironment(self, *args, **kwargs):
        return await self._proxy_call('retrieveEnvironment', *args, **kwargs)

    async def listEnvironments(self, *args, **kwargs):
        return await self._proxy_call('listEnvironments', *args, **kwargs)

    async def createEnvironment(self, *args, **kwargs):
        return await self._proxy_call('createEnvironment', *args, **kwargs)

    # --

    async def textSearchLoad(self, *args, **kwargs):
        return await self._proxy_call('textSearchLoad', *args, **kwargs)

    async def uidSearchLoad(self, *args, **kwargs):
        return await self._proxy_call('uidSearchLoad', *args, **kwargs)

    # --

    async def loadSpecializationFact(self, *args, **kwargs):
        return await self._proxy_call('loadSpecializationFact', *args, **kwargs)

    async def loadSpecializationHierarchy(self, *args, **kwargs):
        return await self._proxy_call('loadSpecializationHierarchy', *args, **kwargs)

    async def clearEnvironmentEntities(self, *args, **kwargs):
        return await self._proxy_call('clearEnvironmentEntities', *args, **kwargs)

    async def loadAllRelatedFacts(self, *args, **kwargs):
        return await self._proxy_call('loadAllRelatedFacts', *args, **kwargs)

    async def unloadEntity(self, *args, **kwargs):
        return await self._proxy_call('unloadEntity', *args, **kwargs)

    async def loadEntities(self, *args, **kwargs):
        return await self._proxy_call('loadEntities', *args, **kwargs)

    async def loadSubtypes(self, *args, **kwargs):
        return await self._proxy_call('loadSubtypes', *args, **kwargs)

    async def loadSubtypesCone(self, *args, **kwargs):
        return await self._proxy_call('loadSubtypesCone', *args, **kwargs)

    async def loadClassified(self, *args, **kwargs):
        return await self._proxy_call('loadClassified', *args, **kwargs)

    async def loadClassificationFact(self, *args, **kwargs):
        return await self._proxy_call('loadClassificationFact', *args, **kwargs)

    async def unloadEntities(self, *args, **kwargs):
        return await self._proxy_call('unloadEntities', *args, **kwargs)

    async def selectEntity(self, *args, **kwargs):
        return await self._proxy_call('selectEntity', *args, **kwargs)

    async def deselectEntity(self, *args, **kwargs):
        # Ensure correct target method name if it differs (e.g., selectEntityNone)
        # Check ApertureClient for the actual method name for deselecting.
        # Assuming it's 'selectEntityNone' based on previous code exploration
        return await self._proxy_call('selectEntityNone', *args, **kwargs)

    async def loadFactHierarchy(self, *args, **kwargs):
        return await self._proxy_call('loadFactHierarchy', *args, **kwargs)

    async def loadEntity(self, *args, **kwargs):
        # This method didn't seem to take user/env id, check signature in ApertureClient
        return await self._proxy_call('loadEntity', *args, **kwargs)

    async def emit_event(self, *args, **kwargs):
        return await self._proxy_call('emit_event', *args, **kwargs)

    # Add other methods as needed, ensuring they call _proxy_call

# For testing directly
async def main():
    # Example usage of the proxy (replace with actual test logic if needed)
    user_id_test = 123
    env_id_test = 'test-env-proxy'
    proxy_client = ApertureClientProxy(user_id_test, env_id_test)

    connected = await proxy_client.connect()
    if connected:
        logger.info(f"Proxy connected successfully for user {user_id_test}")

        # Test retrieving environment via proxy (will use user_id=123, env_id=test-env-proxy)
        env = await proxy_client.retrieveEnvironment()
        logger.info(f"Proxy retrieved environment: {env}")

        # Test listing environments via proxy (will use user_id=123)
        envs = await proxy_client.listEnvironments()
        logger.info(f"Proxy listed environments: {envs}")

        # Test creating environment via proxy (will use user_id=123)
        # created_env = await proxy_client.createEnvironment(env_name="proxy-created-env")
        # logger.info(f"Proxy created environment: {created_env}")

        await proxy_client.disconnect()
        logger.info("Proxy disconnected.")
    else:
        logger.error("Proxy failed to connect.")

# If you want to run this test main:
# if __name__ == "__main__":
#     import asyncio
#     logging.basicConfig(level=logging.INFO)
#     asyncio.run(main())
