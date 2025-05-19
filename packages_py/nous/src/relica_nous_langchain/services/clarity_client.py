#!/usr/bin/env python3

import os
import logging
import asyncio
from dotenv import load_dotenv
from src.meridian.client import WebSocketClient

# Setup logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("clarity-client")

# Load environment variables
load_dotenv()
CLARITY_HOST = os.getenv("CLARITY_HOST", "localhost")
CLARITY_PORT = int(os.getenv("CLARITY_PORT", "2176"))
CLARITY_PATH = os.getenv("CLARITY_PATH", "/ws")

class ClarityClient:
    """
    Client for Clarity service - handles semantic processing and knowledge functions
    """

    def __init__(self):
        logger.info("Initializing Clarity Client")

        # Initialize the WebSocketClient with Clarity service connection details
        self.client = WebSocketClient(
            url=f"ws://{CLARITY_HOST}:{CLARITY_PORT}{CLARITY_PATH}?format=edn&language=python",
            format="edn",
            auto_reconnect=True,
            reconnect_delay=5
        )

        self.connected = False
        self.callbacks = {}

        # Register message handlers
        self.client.on_message("clarity.processing/result", self.on_processing_result)
        self.client.on_message("clarity.chat/history", self.on_chat_history)
        self.client.on_message("clarity.answer/final", self.on_final_answer)

        # Setup connection/disconnection handlers
        self.setup_connection_handlers()

    def setup_connection_handlers(self):
        """Set up connection event handlers"""

        @self.client.on_message("connect")
        async def on_connect(msg_id, payload):
            logger.info("Connected to Clarity service")
            self.connected = True

        @self.client.on_message("disconnect")
        async def on_disconnect(msg_id, payload):
            logger.info("Disconnected from Clarity service")
            self.connected = False
            # Try to reconnect after a delay
            await asyncio.sleep(5)
            await self.connect()

    async def connect(self):
        """Connect to the Clarity service"""
        logger.info("Connecting to Clarity service")
        self.connected = await self.client.connect()
        return self.connected

    async def disconnect(self):
        """Disconnect from the Clarity service"""
        if self.connected:
            await self.client.disconnect()
            self.connected = False

    async def on_processing_result(self, msg_id, payload):
        """Handler for processing results"""
        logger.info("Received processing result")
        # Support both standard and keyword-style keys
        request_id = payload.get("request_id", payload.get(":request_id", None))
        
        if request_id and request_id in self.callbacks:
            callback = self.callbacks.pop(request_id)
            callback(payload)
        elif "request-id" in payload and payload["request-id"] in self.callbacks:
            # Support hyphenated key format
            callback = self.callbacks.pop(payload["request-id"])
            callback(payload)
        return payload

    async def on_chat_history(self, msg_id, payload):
        """Handler for chat history updates"""
        logger.info("Received chat history update")
        # Forward to NOUSServer
        from nous_server import nousServer
        await nousServer.sendChatHistory(payload)
        return payload

    async def on_final_answer(self, msg_id, payload):
        """Handler for final answer updates"""
        logger.info("Received final answer")
        # Forward to NOUSServer
        from nous_server import nousServer
        await nousServer.sendFinalAnswer(payload)
        return payload

    # API methods
    async def process_user_input(self, input_text, callback=None):
        """Process user input through Clarity"""
        if not self.connected:
            logger.warning("Not connected to Clarity, trying to connect...")
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Clarity"}

        request_id = f"req-{id(input_text)}-{int(asyncio.get_event_loop().time())}"

        if callback:
            self.callbacks[request_id] = callback

        try:
            # Use properly formatted message for Clojure compatibility
            response = await self.client.send("clarity.input/process", {
                "request-id": request_id,  # Use hyphenated version for Clojure
                "input": input_text
            })
            return response
        except Exception as e:
            logger.error(f"Error processing user input: {str(e)}")
            return {"error": str(e)}

    async def specializeKind(self, uid, supertype_name, name):
        """Specialize a kind in the semantic model"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Clarity"}

        try:
            response = await self.client.send("clarity.kind/specialize", {
                "uid": uid,
                "supertype_name": supertype_name,
                "name": name
            })
            return response
        except Exception as e:
            logger.error(f"Error specializing kind: {str(e)}")
            return {"error": str(e)}

    async def classifyIndividual(self, uid, kind_name, name):
        """Classify an individual in the semantic model"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Clarity"}

        try:
            response = await self.client.send("clarity.individual/classify", {
                "uid": uid,
                "kind_name": kind_name,
                "name": name
            })
            return response
        except Exception as e:
            logger.error(f"Error classifying individual: {str(e)}")
            return {"error": str(e)}

    async def retrieveModels(self, uids):
        """Retrieve semantic models"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Clarity"}

        try:
            response = await self.client.send("clarity.model/get-batch", {"uids": uids})
            return response
        except Exception as e:
            logger.error(f"Error retrieving models: {str(e)}")
            return {"error": str(e)}

clarity_client = ClarityClient()

# Example usage
# async def test_clarity_client():
#     client = ClarityClient()
#     connected = await client.connect()

#     if connected:
#         # Process a user query
#         result = await client.process_user_input("What is the meaning of life?")
#         print(f"Processing result: {result}")

#         # Wait for some responses
#         await asyncio.sleep(5)

#         await client.disconnect()
#     else:
#         print("Failed to connect to Clarity")
