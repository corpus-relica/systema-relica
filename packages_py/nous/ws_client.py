import json
import asyncio
import websockets
import uuid
import logging
import edn_format
from typing import Dict, Any, Callable, Optional, Union

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("python-sente-client")

class SenteClient:
    """
    Python client for connecting to a Clojure Sente WebSocket server.
    Uses edn_format for proper EDN serialization/deserialization.
    """

    def __init__(self, host: str, port: int, handlers: Dict = None):
        """Initialize a new Sente client."""
        self.uri = f"ws://{host}:{port}/chsk"
        self.handlers = handlers or {}
        self.event_handlers = {}
        self.websocket = None
        self.client_id = str(uuid.uuid4())
        self.connected = False
        self.task = None

    async def connect(self):
        """Connect to the Sente WebSocket server with enhanced error handling."""
        logger.info(f"Connecting to {self.uri}")
        try:
            # Connect with the format Sente expects
            connect_uri = f"{self.uri}?client-id={self.client_id}"
            logger.debug(f"Full connection URI: {connect_uri}")

            # Simplify connection options to work with older websockets versions
            self.websocket = await websockets.connect(connect_uri)

            self.connected = True
            logger.info(f"Connected to {self.uri}")

            # Start the message processing loop
            self.task = asyncio.create_task(self._message_loop())

            return True
        except websockets.exceptions.InvalidStatusCode as e:
            logger.error(f"Connection error - bad status code: {e}")
            self.connected = False
            return False
        except Exception as e:
            logger.error(f"Connection error: {e}", exc_info=True)
            self.connected = False
            return False

    async def disconnect(self):
        """Disconnect from the Sente WebSocket server."""
        logger.info("Disconnecting")
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            self.task = None

        if self.websocket:
            await self.websocket.close()
            self.websocket = None
            self.connected = False

            # Call the on_disconnect handler if provided
            if 'on_disconnect' in self.handlers and self.handlers['on_disconnect']:
                await self._maybe_await(self.handlers['on_disconnect']())

            logger.info("Disconnected")
            return True
        return False

    def is_connected(self) -> bool:
        """Check if the client is connected."""
        return self.connected and self.websocket is not None

    def register_handler(self, event_type: Union[str, list], handler_fn: Callable):
        """Register a handler for a specific event type."""
        if isinstance(event_type, list) and len(event_type) > 0:
            # Handle Sente's vector format: [:event-name data]
            event_type = event_type[0]

        # Convert string to EDN keyword if needed
        if isinstance(event_type, str):
            if not event_type.startswith(":"):
                event_type = f":{event_type}"
            # Convert to EDN keyword
            event_type = edn_format.Keyword(event_type[1:])

        logger.info(f"Registering handler for event: {event_type}")
        self.event_handlers[event_type] = handler_fn
        return True

    def unregister_handler(self, event_type: Union[str, list]):
        """Remove a handler for a specific event type."""
        if isinstance(event_type, list) and len(event_type) > 0:
            event_type = event_type[0]

        # Convert string to EDN keyword if needed
        if isinstance(event_type, str):
            if not event_type.startswith(":"):
                event_type = f":{event_type}"
            # Convert to EDN keyword
            event_type = edn_format.Keyword(event_type[1:])

        if event_type in self.event_handlers:
            logger.info(f"Unregistering handler for event: {event_type}")
            del self.event_handlers[event_type]
            return True
        return False

    async def send_message(self, event_type: str, payload: Any):
        """
        Send a message to the Sente server in EDN format.

        Args:
            event_type: String event type (with or without colon prefix)
            payload: Python data to send (will be converted to EDN)
        """
        if not self.is_connected():
            logger.error("Cannot send message: not connected")
            return {"error": "Not connected"}

        # Format event properly for Sente with keywords
        if isinstance(event_type, str):
            if not event_type.startswith(":"):
                event_keyword = edn_format.Keyword(f"{event_type}")
            else:
                event_keyword = edn_format.Keyword(event_type[1:])  # Remove : prefix
        else:
            event_keyword = event_type  # Assume already an EDN keyword

        # Create the Sente message format: [keyword payload]
        message = [event_keyword, payload]
        # message = {type: event_type, payload: payload}

        try:
            # Convert to EDN format
            edn_message = edn_format.dumps(message)
            logger.info(f"Sending EDN message: {edn_message}")
            print(f"KEYWORD TEST: {edn_format.dumps(edn_format.Keyword('environment/get'))}")

            # Send the EDN-formatted message
            try:
                await self.websocket.send(edn_message)
                return {"success": True}
            except websockets.exceptions.ConnectionClosed as e:
                logger.error(f"Connection closed while sending: {e}")
                self.connected = False
                return {"error": f"Connection closed: {str(e)}"}
        except Exception as e:
            logger.error(f"Error sending message: {e}", exc_info=True)
            return {"error": str(e)}

    async def _message_loop(self):
        """Process incoming messages from the WebSocket."""
        try:
            async for message in self.websocket:
                await self._handle_message(message)
        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
            self.connected = False
            if 'on_disconnect' in self.handlers and self.handlers['on_disconnect']:
                await self._maybe_await(self.handlers['on_disconnect']())
        except Exception as e:
            logger.error(f"Error in message loop: {e}", exc_info=True)
            self.connected = False

    async def _handle_message(self, message_str: str):
        """
        Handle an incoming message from the Sente server.
        Parse EDN format and dispatch to appropriate handlers.
        """
        try:
            logger.debug(f"Received raw message: {message_str}")

            # Parse EDN message
            try:
                message = edn_format.loads(message_str)
                logger.info(f"Parsed EDN message: {message}")
                logger.info(isinstance(message, list))

                # Extract the event ID and payload from the Sente message
                if isinstance(message, list) and len(message) >= 2:
                    event_id = message[0]
                    payload = message[1]

                    logger.info(f"Received event: {event_id} -> {payload}")

                    # Handle different Sente event types
                    if event_id == edn_format.Keyword("chsk/recv"):
                        # This is the main message event from server
                        if isinstance(payload, list) and len(payload) >= 2:
                            inner_event_type = payload[0]
                            inner_payload = payload[1]

                            # Look for a specific handler
                            if inner_event_type in self.event_handlers:
                                await self._maybe_await(self.event_handlers[inner_event_type](inner_payload))
                            # Fall back to the default message handler
                            elif 'on_message' in self.handlers and self.handlers['on_message']:
                                await self._maybe_await(self.handlers['on_message'](str(inner_event_type), inner_payload))

                    elif event_id == edn_format.Keyword("chsk/state"):
                        # Connection state event
                        if isinstance(payload, dict):
                            if payload.get(edn_format.Keyword("first-open"), False):
                                logger.info("WebSocket first open")
                                if 'on_connect' in self.handlers and self.handlers['on_connect']:
                                    await self._maybe_await(self.handlers['on_connect']())
                            elif not payload.get(edn_format.Keyword("open"), False):
                                logger.info("WebSocket closed")
                                self.connected = False
                                if 'on_disconnect' in self.handlers and self.handlers['on_disconnect']:
                                    await self._maybe_await(self.handlers['on_disconnect']())

                    elif event_id == edn_format.Keyword("chsk/handshake"):
                        # Handshake message - this initializes the connection
                        logger.info(f"Received handshake: {payload}")
                        # Handshake received - officially connected
                        if 'on_connect' in self.handlers and self.handlers['on_connect']:
                            await self._maybe_await(self.handlers['on_connect']())

                    elif event_id in (edn_format.Keyword("chsk/ws-ping"), edn_format.Keyword("chsk/ws-pong")):
                        # Ping/pong messages - ignore
                        pass

                    elif event_id == edn_format.Keyword("broadcast/message"):
                        # Handle broadcast messages
                        if isinstance(payload, dict):
                            msg_type = payload.get(edn_format.Keyword("type"))

                            # Convert string type to keyword if needed
                            if isinstance(msg_type, str) and not msg_type.startswith(":"):
                                msg_type = edn_format.Keyword(msg_type)

                            if msg_type in self.event_handlers:
                                await self._maybe_await(self.event_handlers[msg_type](payload))
                            elif edn_format.Keyword("broadcast/message") in self.event_handlers:
                                await self._maybe_await(self.event_handlers[edn_format.Keyword("broadcast/message")](payload))
                            elif 'on_message' in self.handlers and self.handlers['on_message']:
                                await self._maybe_await(self.handlers['on_message']("broadcast/message", payload))

                    else:
                        # Unknown event type, use default handler
                        if 'on_message' in self.handlers and self.handlers['on_message']:
                            await self._maybe_await(self.handlers['on_message'](str(event_id), payload))

            except Exception as e:
                logger.error(f"Failed to parse EDN message: {e}", exc_info=True)
                if 'on_message' in self.handlers and self.handlers['on_message']:
                    await self._maybe_await(self.handlers['on_message']("raw-message", message_str))

        except Exception as e:
            logger.error(f"Error handling message: {e}", exc_info=True)

    async def _maybe_await(self, result):
        """Helper to handle both coroutines and regular functions."""
        if asyncio.iscoroutine(result):
            return await result
        return result

# Simple test
async def test():
    client = SenteClient("localhost", 9030, {
        "on_connect": lambda: print("Connected!"),
        "on_disconnect": lambda: print("Disconnected!"),
        "on_message": lambda evt, payload: print(f"Message: {evt} => {payload}")
    })

    connected = await client.connect()
    if connected:
        print("Connection established, sending test message...")

        response = await client.send_message("test", {"message": "Hello from Python!"})
        print(f"Response: {response}")

        # Wait a bit to receive any response
        await asyncio.sleep(10)
        await client.disconnect()
    else:
        print("Failed to connect!")

if __name__ == "__main__":
    asyncio.run(test())
