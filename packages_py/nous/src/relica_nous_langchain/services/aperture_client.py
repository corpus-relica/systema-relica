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
    Client for Aperture service - handles session management and environment functions
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

    def setup_message_handlers(self):
        """Set up message event handlers"""

        # @self.client.on_message("environment-data")
        # async def on_environment_data(msg_id, payload):
        #     logger.info("Received environment data update")
        #     return payload

        # @self.client.on_message("entity-data")
        # async def on_entity_data(msg_id, payload):
        #     logger.info("Received entity data update")
        #     return payload

        # Setup connection/disconnection handlers
        @self.client.on_message("connect")
        async def on_connect(msg_id, payload):
            logger.info("Connected to Aperture service")
            self.connected = True

        @self.client.on_message("disconnect")
        async def on_disconnect(msg_id, payload):
            logger.info("Disconnected from Aperture service")
            self.connected = False
            # Try to reconnect after a delay
            await asyncio.sleep(5)
            await self.connect()

        @self.client.on_message("facts/loaded")
        async def on_facts_loaded(msg_id, payload):
            logger.info("Facts loaded")
            semantic_model.addFacts(payload['facts'])
            return payload

        @self.client.on_message("facts/unloaded")
        async def on_facts_unloaded(msg_id, payload):
            logger.info("Facts unloaded")
            semantic_model.removeFacts(payload['fact-uids'])
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
            await self.client.disconnect()
            self.connected = False

    # API methods
    async def retrieveEnvironment(self, user_id, environment_id=None):
        """Retrieve the current environment state"""
        logger.info(f"Retrieving environment for user {user_id}")
        if not self.connected:
            logger.warning("Not connected to Aperture, trying to connect...")
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            # Create a payload for EDN format
            if self.client.format.lower() == "edn":
                # Use explicit EDN keywords
                payload = {}
                # payload[edn_format.Keyword("user-id")] = user_id
                payload["user-id"] = user_id
                # if environment_id is not None:
                payload["environment-id"] = environment_id

                    # payload[edn_format.Keyword("environment-id")] = environment_id
            else:
                # Use regular JSON format
                payload = {"user-id": user_id}
                # if environment_id is not None:
                payload["environment-id"] = environment_id

            logger.info(f"Sending environment/get request with payload: {payload}")
            response = await self.client.send("environment/get", payload)
            # logger.info(f"Received environment response: {response}")
            return response
        except Exception as e:
            logger.error(f"Error retrieving environment: {e}", exc_info=True)
            return {"error": f"Failed to retrieve environment: {str(e)}"}

    async def loadEntity(self, uid):
        """Load entity data by UID"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send("load-entity", {"uid": uid})
            return response
        except Exception as e:
            logger.error(f"Error loading entity: {e}")
            return {"error": f"Failed to load entity: {str(e)}"}

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
