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

        @self.client.on_message("facts/loaded")
        async def on_facts_loaded(msg_id, payload):
            logger.info("Facts loaded")
            await semantic_model.addFacts(payload['facts'])
            return payload

        @self.client.on_message("facts/unloaded")
        async def on_facts_unloaded(msg_id, payload):
            logger.info("Facts unloaded")
            await semantic_model.removeFacts(payload['fact-uids'])
            return payload

        @self.client.on_message("entity/selected")
        async def on_entity_selected(msg_id, payload):
            logger.info("Entity selected")
            logger.info(f"Selected entity: {payload['entity-uid']}")
            semantic_model.selected_entity = payload['entity-uid']
            # emit event
            return payload

        @self.client.on_message("entity/selected-none")
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
                await self.client.send("app/heartbeat", {"timestamp": int(asyncio.get_event_loop().time() * 1000)})
            except Exception as e:
                logger.error(f"Failed to send heartbeat: {e}")

    # API methods - Equivalent to the Clojure implementation
    async def retrieveEnvironment(self, user_id, environment_id=None):
        """Retrieve the current environment state (equivalent to get-environment)"""
        logger.info(f"Retrieving environment for user {user_id}")
        if not self.connected:
            logger.warning("Not connected to Aperture, trying to connect...")
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            # Create the payload
            payload = {"user-id": user_id}
            if environment_id is not None:
                payload["environment-id"] = environment_id

            logger.info(f"Sending environment/get request with payload: {payload}")
            response = await self.client.send("environment/get", payload)
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error retrieving environment: {e}", exc_info=True)
            return {"error": f"Failed to retrieve environment: {str(e)}"}

    async def listEnvironments(self, user_id):
        """List all environments for a user (equivalent to list-environments)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("environment/list", {"user-id": user_id})
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error listing environments: {e}")
            return {"error": f"Failed to list environments: {str(e)}"}

    async def createEnvironment(self, user_id, env_name):
        """Create a new environment (equivalent to create-environment)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("environment/create", {
                "user-id": user_id,
                "name": env_name
            })
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error creating environment: {e}")
            return {"error": f"Failed to create environment: {str(e)}"}

    async def loadSpecializationHierarchy(self, user_id, uid):
        """Load specialization hierarchy (equivalent to load-specialization-hierarchy)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("environment/load-specialization", {
                "uid": uid,
                "user-id": user_id
            })
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error loading specialization hierarchy: {e}")
            return {"error": f"Failed to load specialization hierarchy: {str(e)}"}

    async def clearEnvironmentEntities(self, user_id, env_id):
        """Clear all entities from an environment (equivalent to clear-environment-entities)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("environment/clear-entities", {
                "user-id": user_id,
                "environment-id": env_id
            })
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error clearing environment entities: {e}")
            return {"error": f"Failed to clear environment entities: {str(e)}"}

    async def loadAllRelatedFacts(self, user_id, env_id, entity_uid):
        """Load all facts related to an entity (equivalent to load-all-related-facts)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("environment/load-all-related-facts", {
                "user-id": user_id,
                "environment-id": env_id,
                "entity-uid": entity_uid
            })
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error loading related facts: {e}")
            return {"error": f"Failed to load related facts: {str(e)}"}

    async def unloadEntity(self, user_id, env_id, entity_uid):
        """Unload an entity from the environment (equivalent to unload-entity)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("environment/unload-entity", {
                "user-id": user_id,
                "environment-id": env_id,
                "entity-uid": entity_uid
            })
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error unloading entity: {e}")
            return {"error": f"Failed to unload entity: {str(e)}"}

    async def loadEntities(self, user_id, env_id, entity_uids):
        """Load multiple entities (equivalent to load-entities)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("environment/load-entities", {
                "user-id": user_id,
                "environment-id": env_id,
                "entity-uids": entity_uids
            })
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error loading entities: {e}")
            return {"error": f"Failed to load entities: {str(e)}"}

    async def loadSubtypesCone(self, user_id, env_id, entity_uid):
        """Load subtypes cone (equivalent to load-subtypes-cone)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("environment/load-subtypes-cone", {
                "user-id": user_id,
                "environment-id": env_id,
                "entity-uid": entity_uid
            })
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error loading subtypes cone: {e}")
            return {"error": f"Failed to load subtypes cone: {str(e)}"}

    async def unloadEntities(self, user_id, env_id, entity_uids):
        """Unload multiple entities (equivalent to unload-entities)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("environment/unload-entities", {
                "user-id": user_id,
                "environment-id": env_id,
                "entity-uids": entity_uids
            })
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error unloading entities: {e}")
            return {"error": f"Failed to unload entities: {str(e)}"}

    async def updateEnvironment(self, user_id, env_id, updates):
        """Update environment (equivalent to update-environment!)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("environment/update", {
                "user-id": user_id,
                "environment-id": env_id,
                "updates": updates
            })
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error updating environment: {e}")
            return {"error": f"Failed to update environment: {str(e)}"}

    async def selectEntity(self, user_id, env_id, entity_uid):
        """Select an entity (equivalent to select-entity)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("entity/select", {
                "user-id": user_id,
                "environment-id": env_id,
                "entity-uid": entity_uid
            })
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error selecting entity: {e}")
            return {"error": f"Failed to select entity: {str(e)}"}

    async def selectEntityNone(self, user_id, env_id):
        """Deselect all entities (equivalent to select-entity-none)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("entity/select-none", {
                "user-id": user_id,
                "environment-id": env_id
            })
            return response['payload'] if 'payload' in response else response
        except Exception as e:
            logger.error(f"Error deselecting entities: {e}")
            return {"error": f"Failed to deselect entities: {str(e)}"}

    # Existing methods
    async def loadEntity(self, uid):
        """Load entity data by UID"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("environment/load-entity", {"uid": uid})
            return response['payload']
        except Exception as e:
            logger.error(f"Error loading entity: {e}")
            return {"error": f"Failed to load entity: {str(e)}"}

    async def textSearchLoad(self, term):
        """Load entity data by text search term"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("environment/text-search-load", {"term": term})
            print("//////////////////////////////// TEXT SEARCH LOAD RESPONSE ////////////////////////////////")
            print(response['payload'])
            return response['payload']
        except Exception as e:
            logger.error(f"Error loading entity by text search: {e}")
            return {"error": f"Failed to load entity by text search: {str(e)}"}

    # Helper method for emit
    async def emit(self, target, event_type, payload):
        """Emit an event (used in the textSearchLoad method)"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send(f"{target}/{event_type}", payload)
            return response
        except Exception as e:
            logger.error(f"Error emitting event: {e}")
            return {"error": f"Failed to emit event: {str(e)}"}

# Create a singleton instance
aperture_client = ApertureClient()

# For testing directly
# async def test_aperture_client():
#     client = ApertureClient()
#     connected = await client.connect()

#     if connected:
#         logger.info("Connection successful!")
#         env = await client.retrieveEnvironment(7)  # Pass user_id as required
#         logger.info(f"Environment: {env}")

#         await client.disconnect()
#     else:
#         logger.error("Failed to connect to Aperture")
