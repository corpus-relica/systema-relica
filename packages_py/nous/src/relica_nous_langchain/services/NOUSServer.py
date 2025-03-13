import asyncio
import logging
from src.meridian.server import WebSocketServer, app, ws_server
from fastapi import FastAPI

# Set up logging - suppress EDN format logs
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logging.getLogger("edn_format").setLevel(logging.WARNING)  # Suppress EDN logs
logger = logging.getLogger("nous_app")

class NOUSServer:
    """
    WebSocket server for browser connections to NOUS system
    """
    def __init__(self):
        self.handle_user_input_func = None


        logger.info("Initialized NOUSServer")

    def init(self, handle_user_input_func):
        """Initialize the server with handler for user input"""
        logger.info("Initializing NOUSServer")
        self.handle_user_input_func = handle_user_input_func
        return self

    async def start_server(self):
        """Start the WebSocket server for browser connections"""
        logger.info(f"Starting WebSocket server")
        # The server actually starts when uvicorn runs the FastAPI app
        # We just need to create a never-ending task to keep the script running
        await asyncio.Future()  # Run foreverport asyncio

    async def handle_user_input(self, payload, client_id):
        """Handle user input message from browser client"""
        logger.info(f"!!!!!!!!!!!!!1111 Received user input: {payload}")
        logger.info(f"!!!!!!!!!!!!!1111 Client ID: {client_id}")
        # Call the provided handler with the input
        if self.handle_user_input_func:
            await self.handle_user_input_func(payload['message'])

    async def heartbeat(self, message, client_id):
        """Handle heartbeat message from browser client"""
        logger.info(f"Heartbeat received: {message}")

    async def send_chat_history(self, chat_history):
        """Send chat history to all browser clients"""
        logger.info(f"Sending chat history")

        # Create the message in the format expected by broadcast
        message = {
            "id": "nous-server",
            "type": "chatHistory",
            "payload": chat_history
        }

        # Call broadcast with the properly formatted message
        client_count = await ws_server.broadcast(message)
        logger.info(f"Chat history sent to {client_count} clients")

    async def send_final_answer(self, final_answer):
        """Send final answer to all browser clients"""
        logger.info(f"Sending final answer")

        # Create the message in the format expected by broadcast
        message = {
            "id": "nous-server",
            "type": ":final_answer",
            "titties": "DDD",
            "payload": final_answer
        }

        # Call broadcast with the properly formatted message
        client_count = await ws_server.broadcast(message)
        logger.info(f"Final answer sent to {client_count} clients")

nous_server = NOUSServer()
ws_server.register_handler("app/user-input", nous_server.handle_user_input)
print("Registered user input handler")
print(nous_server.handle_user_input)

ws_server.register_handler("app/heartbeat", nous_server.heartbeat)

# import os
# import json
# import logging
# import websockets
# from dotenv import load_dotenv
# from websockets.server import serve

# # Setup logging
# logging.basicConfig(level=logging.INFO,
#                     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
# logger = logging.getLogger("nous-server")

# # Load environment variables
# load_dotenv()
# NOUS_HOST = os.getenv("NOUS_HOST", "0.0.0.0")
# NOUS_PORT = int(os.getenv("NOUS_PORT", "2204"))

# # Keep track of connected browser clients
# connected_clients = set()

# class NOUSServer:
#     """
#     WebSocket server for browser connections to NOUS system
#     """

#     def __init__(self):
#         self.handle_user_input = None
#         logger.info("Initialized NOUSServer")

#     def init(self, handle_user_input_func):
#         """Initialize the server with handler for user input"""
#         logger.info("Initializing NOUSServer")
#         self.handle_user_input = handle_user_input_func
#         return self

#     async def start_server(self):
#         """Start the WebSocket server for browser connections"""
#         logger.info(f"Starting WebSocket server on {NOUS_HOST}:{NOUS_PORT}")
#         async with serve(self.handle_connection, NOUS_HOST, NOUS_PORT):
#             await asyncio.Future()  # Run forever

#     async def handle_connection(self, websocket, path):
#         """Handle a new WebSocket connection from a browser"""
#         client_id = id(websocket)
#         logger.info(f"New client connected: {client_id}")

#         # Add the new client to our set
#         connected_clients.add(websocket)

#         try:
#             # Handle messages from this client
#             async for message in websocket:
#                 await self.handle_browser_message(websocket, message)
#         except websockets.exceptions.ConnectionClosed:
#             logger.info(f"Client disconnected: {client_id}")
#         finally:
#             # Remove the client when they disconnect
#             connected_clients.remove(websocket)

#     async def handle_browser_message(self, websocket, message):
#         """Process a message from a browser client"""
#         try:
#             data = json.loads(message)
#             logger.info(f"Received message: {data}")

#             role = data.get('role')
#             content = data.get('content')

#             if role == "user" and content and self.handle_user_input:
#                 # Process the user input with the provided handler
#                 await self.handle_user_input(input=content)

#                 # Acknowledge receipt (optional)
#                 await websocket.send(json.dumps({
#                     "event": "message_received",
#                     "data": {"content": content}
#                 }))

#         except json.JSONDecodeError:
#             logger.error(f"Invalid JSON received: {message}")
#         except Exception as e:
#             logger.error(f"Error handling message: {e}", exc_info=True)

#     async def send_to_all_browsers(self, event, data):
#         """Send a message to all connected browser clients"""
#         if not connected_clients:
#             logger.info(f"No clients connected to send {event}")
#             return

#         # Prepare the message
#         message = json.dumps({"event": event, "data": data})

#         # Send to all connected clients
#         disconnected = set()
#         for websocket in connected_clients:
#             try:
#                 await websocket.send(message)
#             except websockets.exceptions.ConnectionClosed:
#                 disconnected.add(websocket)

#         # Remove disconnected clients
#         for websocket in disconnected:
#             connected_clients.remove(websocket)


# # Create singleton instance
# # nous_server = NOUSServer()

# # Example usage
# async def main():
#     async def handle_user_input(input):
#         logger.info(f"Processing user input: {input}")
#         # Example response - in a real app, this would come from your NLP pipeline
#         await nous_server.send_chat_history([
#             {"role": "user", "content": input},
#             {"role": "assistant", "content": f"I received: {input}"}
#         ])

#     # Initialize and start the server
#     nous_server.init(handle_user_input)
#     await nous_server.start_server()

# if __name__ == "__main__":
#     asyncio.run(main())
#!/home/marc/miniconda3/envs/test_sente/bin/python
"""
Example of extending the WebSocket server with custom handlers
"""

#!/usr/bin/env python3

"""
Example application showing how to use the WebSocket server.
This example demonstrates:

1. Setting up custom message handlers
2. Broadcasting messages to clients
3. Handling client connections and disconnections
"""
