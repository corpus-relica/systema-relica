#!/usr/bin/env python3

import os
import logging
import asyncio
from dotenv import load_dotenv
from ws_client import SenteClient

# Setup logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("clarity-client")

# Load environment variables
load_dotenv()
CLARITY_HOST = os.getenv("CLARITY_HOST", "localhost")
CLARITY_PORT = int(os.getenv("CLARITY_PORT", "2176"))

class ClarityClient:
    """
    Client for Clarity service - handles semantic processing and knowledge functions
    """

    def __init__(self):
        logger.info("Initializing Clarity Client")
        self.client = SenteClient(
            host=CLARITY_HOST,
            port=CLARITY_PORT,
            handlers={
                "on_connect": self.on_connect,
                "on_disconnect": self.on_disconnect,
                "on_message": self.on_message
            }
        )
        self.connected = False
        self.callbacks = {}

        # Register handlers for specific message types
        self.client.register_handler("processing-result", self.on_processing_result)
        self.client.register_handler("chat-history", self.on_chat_history)
        self.client.register_handler("final-answer", self.on_final_answer)

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

    # Sente client event handlers
    async def on_connect(self):
        """Handler for Sente connection established"""
        logger.info("Connected to Clarity service")
        self.connected = True

    async def on_disconnect(self):
        """Handler for Sente connection lost"""
        logger.info("Disconnected from Clarity service")
        self.connected = False
        # Try to reconnect after a delay
        await asyncio.sleep(5)
        await self.connect()

    async def on_message(self, event_type, payload):
        """Default handler for Sente messages"""
        logger.info(f"Received message from Clarity: {event_type}")

    async def on_processing_result(self, payload):
        """Handler for processing results"""
        logger.info("Received processing result")
        if "request_id" in payload and payload["request_id"] in self.callbacks:
            callback = self.callbacks.pop(payload["request_id"])
            callback(payload)
        return payload

    async def on_chat_history(self, payload):
        """Handler for chat history updates"""
        logger.info("Received chat history update")
        # Forward to NOUSServer
        from nous_server import nousServer
        await nousServer.sendChatHistory(payload)
        return payload

    async def on_final_answer(self, payload):
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

        response = await self.client.send_message("process-input", {
            "request_id": request_id,
            "input": input_text
        })

        return response

    async def specializeKind(self, uid, supertype_name, name):
        """Specialize a kind in the semantic model"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Clarity"}

        response = await self.client.send_message("specialize-kind", {
            "uid": uid,
            "supertype_name": supertype_name,
            "name": name
        })

        return response

    async def classifyIndividual(self, uid, kind_name, name):
        """Classify an individual in the semantic model"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Clarity"}

        response = await self.client.send_message("classify-individual", {
            "uid": uid,
            "kind_name": kind_name,
            "name": name
        })

        return response

    async def retrieveModels(self):
        """Retrieve semantic models"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Clarity"}

        response = await self.client.send_message("retrieve-models", {})
        return response

# Example usage
async def test_clarity_client():
    client = ClarityClient()
    connected = await client.connect()

    if connected:
        # Process a user query
        result = await client.process_user_input("What is the meaning of life?")
        print(f"Processing result: {result}")

        # Wait for some responses
        await asyncio.sleep(5)

        await client.disconnect()
    else:
        print("Failed to connect to Clarity")

if __name__ == "__main__":
    asyncio.run(test_clarity_client())
