#!/usr/bin/env python3

"""
WebSocket Client compatible with both the Python and Clojure WebSocket servers
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Callable, Optional, List, Union, Awaitable

import websockets

from src.meridian.message_format import serialize_message, deserialize_message, FORMAT_JSON, FORMAT_EDN

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("websocket_client")


class WebSocketClient:
    """WebSocket client implementation"""

    def __init__(self, url: str = "ws://localhost:3030/ws", format: str = FORMAT_EDN, auto_reconnect: bool = True, reconnect_delay: int = 5):
        """Initialize WebSocket client"""
        self.url = url
        self.format = format
        self.websocket = None
        self.connected = False
        self.message_handlers = {}
        self.response_futures = {}
        self.client_id = str(uuid.uuid4())
        self.message_counter = 0
        self.auto_reconnect = auto_reconnect
        self.reconnect_delay = reconnect_delay
        self.reconnect_task = None

    async def connect(self):
        """Connect to WebSocket server"""
        try:
            self.websocket = await websockets.connect(self.url)
            self.connected = True
            logger.info(f"Connected to WebSocket server at {self.url}")

            # Start listening for messages
            asyncio.create_task(self.listen())

            # Cancel any existing reconnection task
            if self.reconnect_task:
                self.reconnect_task.cancel()
                self.reconnect_task = None

            return True
        except Exception as e:
            logger.error(f"Error connecting to WebSocket server: {str(e)}")
            self.connected = False

            # Start reconnection task if auto_reconnect is enabled
            if self.auto_reconnect and not self.reconnect_task:
                self.start_reconnection_loop()

            return False

    def start_reconnection_loop(self):
        """Start the reconnection loop"""
        if self.reconnect_task is None:
            async def reconnection_loop():
                while self.auto_reconnect and not self.connected:
                    logger.info(f"Waiting {self.reconnect_delay} seconds before reconnection attempt...")
                    await asyncio.sleep(self.reconnect_delay)
                    logger.info("Attempting to reconnect...")
                    try:
                        await self.connect()
                        if self.connected:
                            logger.info("Successfully reconnected")
                            return
                    except Exception as e:
                        logger.error(f"Error during reconnection attempt: {str(e)}")

            self.reconnect_task = asyncio.create_task(reconnection_loop())

    async def disconnect(self):
        """Disconnect from WebSocket server"""
        # Cancel any existing reconnection task
        if self.reconnect_task:
            self.reconnect_task.cancel()
            self.reconnect_task = None

        if self.websocket:
            await self.websocket.close()
            self.websocket = None
            self.connected = False
            logger.info("Disconnected from WebSocket server")

            # Clean up any pending response futures
            for msg_id, future in list(self.response_futures.items()):
                future.set_exception(ConnectionError("WebSocket disconnected"))
                del self.response_futures[msg_id]

    async def listen(self):
        """Listen for incoming messages"""
        try:
            async for message in self.websocket:
                try:
                    # Parse message
                    parsed_message = deserialize_message(message, self.format)

                    if not parsed_message:
                        logger.error(f"Failed to parse message: {message}")
                        continue

                    # Extract message details
                    msg_id = parsed_message.get("id", "")
                    msg_type = parsed_message.get("type", "")
                    payload = parsed_message.get("payload", {})

                    # print(f"Received message: {parsed_message}")

                    # Check if we have a pending request future for this message ID
                    if msg_id in self.response_futures:
                        future = self.response_futures[msg_id]
                        future.set_result(parsed_message)
                        del self.response_futures[msg_id]

                    # Handle message by type
                    if msg_type in self.message_handlers:
                        handler = self.message_handlers[msg_type]
                        await handler(msg_id, payload)

                except Exception as e:
                    logger.error(f"Error processing message: {str(e)}")

        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
            self.connected = False
            self.websocket = None

            # Handle reconnection
            if self.auto_reconnect:
                logger.info("Connection closed, starting reconnection process")
                self.start_reconnection_loop()

    async def send(self, msg_type: str, payload: dict = None, timeout: float = None) -> dict:
        """Send a message to the server and optionally wait for a response"""
        if not self.websocket:
            raise RuntimeError("Not connected to server")

        msg_id = f"client-{self.client_id}-{self.message_counter}"
        self.message_counter += 1

        message = {
            "id": msg_id,
            "type": msg_type,
            "payload": payload or {}
        }

        logger.info(f"Sending message: {message}")

        # Serialize message
        message_str = serialize_message(message, self.format)

        # Create future for response
        future = asyncio.Future()
        self.response_futures[msg_id] = future

        try:
            await self.websocket.send(message_str)
            logger.debug(f"Sent message: {message}")

            # Wait for response with timeout (if specified)
            if timeout is not None:
                response = await asyncio.wait_for(future, timeout)
            else:
                response = await future

            return response

        except asyncio.TimeoutError:
            logger.error(f"Request timeout: {msg_type}")
            del self.response_futures[msg_id]
            raise TimeoutError(f"Request timeout: {msg_type}")

        except Exception as e:
            logger.error(f"Error in request: {str(e)}")
            if msg_id in self.response_futures:
                del self.response_futures[msg_id]
            raise

    def on_message(self, msg_type: str, handler: Optional[Callable[[str, Dict[str, Any]], Awaitable[None]]] = None):
        """Register a message handler.

        Can be used as a decorator:
        @client.on_message("message_type")
        async def handler(msg_id, payload):
            pass

        Or directly:
        client.on_message("message_type", handler)
        """
        # When used as a decorator
        if handler is None:
            def decorator(handler_func):
                self.message_handlers[msg_type] = handler_func
                return handler_func
            return decorator
        # When used directly
        else:
            self.message_handlers[msg_type] = handler
            return handler


async def main():
    """Example usage of WebSocketClient"""
    import argparse

    # Parse command line arguments
    parser = argparse.ArgumentParser(description='WebSocket Client')
    parser.add_argument('server_uri', nargs='?', default="ws://localhost:3030/ws",
                        help='WebSocket server URI (default: ws://localhost:3030/ws)')
    parser.add_argument('format', nargs='?', default="json", choices=["json", "edn"],
                        help='Message format: json or edn (default: json)')
    parser.add_argument('--reconnect-delay', type=int, default=5,
                        help='Reconnection delay in seconds (default: 5)')
    parser.add_argument('--test-duration', type=int, default=120,
                        help='Test duration in seconds (default: 120)')
    args = parser.parse_args()

    logger.info(f"Starting WebSocket client with format: {args.format}")
    logger.info(f"Connecting to: {args.server_uri}")
    logger.info(f"Reconnection delay: {args.reconnect_delay} seconds")

    # Create client
    client = WebSocketClient(args.server_uri, args.format, reconnect_delay=args.reconnect_delay)

    # Define message handlers
    @client.on_message("heartbeat")
    async def handle_heartbeat(msg_id, payload):
        server_time = payload.get("server_time", 0)
        logger.info(f"Received heartbeat from server: {server_time}")

    @client.on_message("broadcast")
    async def handle_broadcast(msg_id, payload):
        from_client = payload.get("from", "unknown")
        broadcast_message = payload.get("message", "")
        logger.info(f"Broadcast from {from_client}: {broadcast_message}")

    # Connect to server
    connected = await client.connect()
    if not connected:
        logger.error("Failed to connect to server")
        return

    # Example: Get server status
    try:
        status_response = await client.send("status", timeout=5.0)
        logger.info(f"Server status: {status_response}")
    except Exception as e:
        logger.error(f"Error getting server status: {str(e)}")

    # Example: Send a broadcast message
    try:
        broadcast_response = await client.send("request-broadcast", {
            "message": "Hello from Python client!",
            "timestamp": int(datetime.now().timestamp() * 1000)
        }, timeout=5.0)
        logger.info(f"Broadcast response: {broadcast_response}")
    except Exception as e:
        logger.error(f"Error sending broadcast: {str(e)}")

    # Run for a while to demonstrate reconnection
    start_time = datetime.now()
    try:
        while (datetime.now() - start_time).total_seconds() < args.test_duration:
            await asyncio.sleep(5)
            # Send periodic status requests to verify connection
            if client.connected:
                try:
                    ping_response = await client.send("ping", {
                        "timestamp": int(datetime.now().timestamp() * 1000)
                    }, timeout=2.0)
                    logger.info(f"Ping response: {ping_response}")
                except Exception as e:
                    logger.warning(f"Ping failed: {str(e)}")
            else:
                logger.info("Client disconnected. Will automatically reconnect...")

            logger.info(f"Client status: {'Connected' if client.connected else 'Disconnected'} - Press Ctrl+C to stop")
    except KeyboardInterrupt:
        logger.info("Test interrupted by user")
    except Exception as e:
        logger.error(f"Error during test: {str(e)}")
    finally:
        # Disconnect
        await client.disconnect()
        logger.info("Client disconnected and test completed")


if __name__ == "__main__":
    asyncio.run(main())
