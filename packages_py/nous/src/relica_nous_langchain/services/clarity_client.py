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

class ClarityClientProxy:
    """A proxy class for ClarityClient that automatically injects user/env context."""
    def __init__(self, user_id, env_id):
        self.user_id = user_id
        self.env_id = env_id
        # Hold a reference to the singleton client
        self._target_client = clarity_client

    async def _proxy_call(self, method_name, *args, **kwargs):
        """Injects context and calls the target client's method."""
        target_method = getattr(self._target_client, method_name)

        # Construct the final arguments by prepending user_id and env_id
        final_args = (self.user_id, self.env_id) + args
        final_kwargs = kwargs  # Pass kwargs through as is

        logger.debug(f"Proxying call to {method_name} with args: {final_args}, kwargs: {final_kwargs}")
        return await target_method(*final_args, **final_kwargs)

    # --- Connection methods that don't need user context --- #
    
    async def connect(self, *args, **kwargs):
        # Connection doesn't usually need user context, forward directly
        return await self._target_client.connect(*args, **kwargs)

    async def disconnect(self, *args, **kwargs):
        return await self._target_client.disconnect(*args, **kwargs)

    # --- API methods --- #

    async def process_user_input(self, *args, **kwargs):
        # This method likely doesn't need user/env context, so we'll call it directly
        return await self._target_client.process_user_input(*args, **kwargs)

    async def specializeKind(self, *args, **kwargs):
        return await self._proxy_call('specializeKind', *args, **kwargs)

    async def classifyIndividual(self, *args, **kwargs):
        return await self._proxy_call('classifyIndividual', *args, **kwargs)

    async def retrieveModels(self, *args, **kwargs):
        return await self._proxy_call('retrieveModels', *args, **kwargs)

# For testing directly
async def main():
    # Example usage of the proxy
    user_id_test = 123
    env_id_test = 'test-env-proxy'
    proxy_client = ClarityClientProxy(user_id_test, env_id_test)

    connected = await proxy_client.connect()
    if connected:
        logger.info(f"Proxy connected successfully for user {user_id_test}")

        # Test processing a user query via proxy
        result = await proxy_client.process_user_input("What is the meaning of life?")
        logger.info(f"Proxy processed user input: {result}")

        await proxy_client.disconnect()
        logger.info("Proxy disconnected.")
    else:
        logger.error("Proxy failed to connect.")

# If you want to run this test main:
# if __name__ == "__main__":
#     import asyncio
#     logging.basicConfig(level=logging.INFO)
#     asyncio.run(main())
