import asyncio
import os
import json
import logging
import websockets
from dotenv import load_dotenv
from websockets.server import serve

# Setup logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("nous-server")

# Load environment variables
load_dotenv()
NOUS_HOST = os.getenv("NOUS_HOST", "0.0.0.0")
NOUS_PORT = int(os.getenv("NOUS_PORT", "2204"))

# Keep track of connected browser clients
connected_clients = set()

class NOUSServer:
    """
    WebSocket server for browser connections to NOUS system
    """

    def __init__(self):
        self.handle_user_input = None
        logger.info("Initialized NOUSServer")

    def init(self, handle_user_input_func):
        """Initialize the server with handler for user input"""
        logger.info("Initializing NOUSServer")
        self.handle_user_input = handle_user_input_func
        return self

    async def start_server(self):
        """Start the WebSocket server for browser connections"""
        logger.info(f"Starting WebSocket server on {NOUS_HOST}:{NOUS_PORT}")
        async with serve(self.handle_connection, NOUS_HOST, NOUS_PORT):
            await asyncio.Future()  # Run forever

    async def handle_connection(self, websocket, path):
        """Handle a new WebSocket connection from a browser"""
        client_id = id(websocket)
        logger.info(f"New client connected: {client_id}")

        # Add the new client to our set
        connected_clients.add(websocket)

        try:
            # Handle messages from this client
            async for message in websocket:
                await self.handle_browser_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client disconnected: {client_id}")
        finally:
            # Remove the client when they disconnect
            connected_clients.remove(websocket)

    async def handle_browser_message(self, websocket, message):
        """Process a message from a browser client"""
        try:
            data = json.loads(message)
            logger.info(f"Received message: {data}")

            role = data.get('role')
            content = data.get('content')

            if role == "user" and content and self.handle_user_input:
                # Process the user input with the provided handler
                await self.handle_user_input(input=content)

                # Acknowledge receipt (optional)
                await websocket.send(json.dumps({
                    "event": "message_received",
                    "data": {"content": content}
                }))

        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received: {message}")
        except Exception as e:
            logger.error(f"Error handling message: {e}", exc_info=True)

    async def send_to_all_browsers(self, event, data):
        """Send a message to all connected browser clients"""
        if not connected_clients:
            logger.info(f"No clients connected to send {event}")
            return

        # Prepare the message
        message = json.dumps({"event": event, "data": data})

        # Send to all connected clients
        disconnected = set()
        for websocket in connected_clients:
            try:
                await websocket.send(message)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(websocket)

        # Remove disconnected clients
        for websocket in disconnected:
            connected_clients.remove(websocket)

    async def send_chat_history(self, chat_history):
        """Send chat history to all browser clients"""
        logger.info(f"Sending chat history")
        await self.send_to_all_browsers("chatHistory", chat_history)

    async def send_final_answer(self, final_answer):
        """Send final answer to all browser clients"""
        logger.info(f"Sending final answer")
        await self.send_to_all_browsers("final_answer", final_answer)

# Create singleton instance
# nous_server = NOUSServer()

# Example usage
async def main():
    async def handle_user_input(input):
        logger.info(f"Processing user input: {input}")
        # Example response - in a real app, this would come from your NLP pipeline
        await nous_server.send_chat_history([
            {"role": "user", "content": input},
            {"role": "assistant", "content": f"I received: {input}"}
        ])

    # Initialize and start the server
    nous_server.init(handle_user_input)
    await nous_server.start_server()

if __name__ == "__main__":
    asyncio.run(main())
