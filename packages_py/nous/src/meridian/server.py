#!/usr/bin/env python3

"""
WebSocket Server compatible with Clojure clients
"""

import asyncio
import json
import logging
import re
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable, Awaitable, Set, Union

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query
from pydantic import BaseModel, Field

from src.meridian.message_format import serialize_message, deserialize_message, FORMAT_JSON, FORMAT_EDN

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("websocket_server")

# Create FastAPI app
app = FastAPI(title="WebSocket Server")

# Store for connected clients
connected_clients: Dict[str, Dict] = {}

# Message handler registry
message_handlers: Dict[str, Callable] = {}

class WebSocketMessage(BaseModel):
    """WebSocket message model"""
    id: str
    type: str
    payload: Dict[str, Any] = Field(default_factory=dict)


class WebSocketResponse(BaseModel):
    """WebSocket response model"""
    id: str
    type: str
    payload: Dict[str, Any] = Field(default_factory=dict)


class WebSocketServer:
    """WebSocket server implementation"""

    def __init__(self):
        self.clients: Dict[str, Dict] = connected_clients
        self.handlers: Dict[str, Callable] = message_handlers

    async def add_client(self, client_id: str, websocket: WebSocket, client_format: str = "json", client_language: str = "python"):
        """Register a new client connection"""
        connected_at = datetime.now().timestamp() * 1000  # milliseconds since epoch
        self.clients[client_id] = {
            "websocket": websocket,
            "connected_at": connected_at,
            "format": client_format,
            "language": client_language
        }
        logger.info(f"Client connected: {client_id} format: {client_format} language: {client_language}")

    async def remove_client(self, client_id: str):
        """Unregister a client connection"""
        if client_id in self.clients:
            del self.clients[client_id]
            logger.info(f"Client disconnected: {client_id}")

    def register_handler(self, msg_type: str, handler: Callable):
        """Register a message handler"""
        self.handlers[msg_type] = handler
        logger.info(f"Registered handler for message type: {msg_type}")

    def get_client_ids(self) -> List[str]:
        """Get list of connected client IDs"""
        return list(self.clients.keys())

    def get_client_info(self, client_id: str) -> Optional[Dict]:
        """Get client info without websocket connection"""
        if client_id in self.clients:
            client_info = self.clients[client_id].copy()
            # Don't include websocket in client info
            client_info.pop("websocket", None)
            return client_info
        return None

    def count_connected_clients(self) -> int:
        """Count connected clients"""
        return len(self.clients)

    async def send(self, client_id: str, message: Union[Dict, WebSocketResponse]) -> bool:
        """Send message to a specific client"""
        if client_id not in self.clients:
            logger.warning(f"Client not found: {client_id}")
            return False

        client = self.clients[client_id]
        websocket = client["websocket"]
        client_format = client.get("format", FORMAT_JSON)

        # Convert to dict if WebSocketResponse
        if isinstance(message, WebSocketResponse):
            message = message.dict()

        # Serialize message to client's format
        message_str = serialize_message(message, client_format)

        try:
            await websocket.send_text(message_str)
            return True
        except Exception as e:
            logger.error(f"Error sending message to {client_id}: {str(e)}")
            return False

    async def broadcast(self, message: Union[Dict, WebSocketResponse]) -> int:
        """Broadcast message to all connected clients"""
        client_count = len(self.clients)

        # Convert to dict if WebSocketResponse
        if isinstance(message, WebSocketResponse):
            message = message.dict()

        msg_type = message.get("type", "unknown")
        payload = message.get("payload", {})

        # logger.info(f"Broadcasting message to {client_count} clients: type={msg_type}, payload={payload}")

        # Send to each client
        for client_id, client in self.clients.items():
            client_format = client.get("format", FORMAT_JSON)
            websocket = client["websocket"]

            # print(f"Sending to client: {client_id}")
            # print(f"Message: {message}")

            # Serialize message to client's format
            message_str = serialize_message(message, client_format)
            #escape message_str
            # message_str = message_str.replace('"', '\\"')
            # print(f"Serialized message: {message_str}")

            try:
                await websocket.send_text(message_str)
            except Exception as e:
                logger.error(f"Error broadcasting to {client_id}: {str(e)}")

        return client_count

# Message handlers
async def handle_ping(message: Dict, client_id: str) -> Dict:
    """Handle ping messages"""
    # logger.info(f"Ping received from client: {client_id}")
    return {
        "pong": True,
        "server_time": int(datetime.now().timestamp() * 1000)
    }


async def handle_status(message: Dict, client_id: str) -> Dict:
    """Handle status requests"""
    clients = ws_server.get_client_ids()
    return {
        "status": "ok",
        "server_time": int(datetime.now().timestamp() * 1000),
        "clients_count": len(clients),
        "clients": [
            {
                "id": cid,
                "info": ws_server.get_client_info(cid)
            } for cid in clients
        ]
    }


async def handle_sync_files(message: Dict, client_id: str) -> Dict:
    """Handle file sync requests"""
    files = message.get("files", [])
    logger.info(f"Received {len(files)} files to sync from client: {client_id}")

    return {
        "synced": len(files),
        "status": "ok",
        "timestamp": int(datetime.now().timestamp() * 1000)
    }


async def handle_request_broadcast(message: Dict, client_id: str) -> Dict:
    """Handle broadcast requests"""
    client_id = message.get("client_id", client_id)
    client_message = message.get("message", "")
    timestamp = message.get("timestamp", int(datetime.now().timestamp() * 1000))

    logger.info(f"Broadcasting message from client: {client_id} Message: {client_message}")

    # Send broadcast to all clients
    await ws_server.broadcast({
        "id": "server",
        "type": "broadcast",
        "payload": {
            "from": client_id,
            "message": client_message,
            "timestamp": timestamp
        }
    })

    # Return success response
    return {
        "broadcast": True,
        "recipients": ws_server.count_connected_clients(),
        "timestamp": int(datetime.now().timestamp() * 1000)
    }


async def handle_test_multimethod(message: Dict, client_id: str) -> Dict:
    """Handle test multimethod requests"""
    logger.info(f"Handling test-multimethod message: {message}")
    return {
        "success": True,
        "message": "Multimethod handler processed your request",
        "data": message
    }


# Register standard handlers
async def register_handlers():
    """Register standard message handlers"""
    ws_server.register_handler("ping", handle_ping)
    ws_server.register_handler("status", handle_status)
    ws_server.register_handler("sync-files", handle_sync_files)
    ws_server.register_handler("request-broadcast", handle_request_broadcast)
    ws_server.register_handler("test-multimethod", handle_test_multimethod)


# Start heartbeat task
async def send_heartbeat():
    """Send heartbeat messages to all clients periodically"""
    while True:
        try:
            await ws_server.broadcast({
                "id": "server",
                "type": "heartbeat",
                "payload": {
                    "server_time": int(datetime.now().timestamp() * 1000),
                    "active_clients": ws_server.count_connected_clients()
                }
            })
            # logger.info(f"Sent heartbeat to {ws_server.count_connected_clients()} clients")
        except Exception as e:
            logger.error(f"Error sending heartbeat: {str(e)}")

        await asyncio.sleep(10)  # Send heartbeat every 10 seconds


@app.on_event("startup")
async def startup():
    """Start the heartbeat task when the server starts"""
    logger.info("WebSocket server started")
    asyncio.create_task(send_heartbeat())
    await register_handlers()


@app.on_event("shutdown")
async def shutdown():
    """Stop the heartbeat task when the server stops"""
    logger.info("WebSocket server stopping")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, format: str = Query("json"), language: str = Query("python")):
    """
    WebSocket endpoint for clients

    Args:
        websocket: The WebSocket connection
        format: The message format (json or edn)
        language: The client language
    """
    # Log connection attempt with details
    logger.info(f"WebSocket connection attempt - Format: {format}, Language: {language}")
    
    # Accept WebSocket connection
    await websocket.accept()
    
    # Generate client ID
    client_id = str(uuid.uuid4())
    
    # Store client with format and language info
    await ws_server.add_client(client_id, websocket, format, language)
    
    logger.info(f"Client connected successfully: {client_id} format: {format} language: {language}")
    
    # Send a connection confirmation message to the client
    await ws_server.send(client_id, {
        "id": "server",
        "type": "connect",
        "payload": {
            "client_id": client_id,
            "server_time": int(datetime.now().timestamp() * 1000),
            "format": format,
            "language": language
        }
    })

    try:
        # Handle incoming messages
        while True:
            # Receive message
            data = await websocket.receive_text()

            try:
                # Parse message based on client format
                client_format = ws_server.clients[client_id].get("format", FORMAT_JSON)
                message = deserialize_message(data, client_format)

                if not message:
                    logger.error(f"Failed to parse message: {data}")
                    await ws_server.send(client_id, {
                        "id": "server",
                        "type": "error",
                        "payload": {
                            "error": f"Could not parse message: {data}"
                        }
                    })
                    continue

                # Extract message details with improved handling for different formats
                msg_id = message.get("id", message.get(":id", "unknown"))
                
                # Handle different message type formats
                msg_type = message.get("type", message.get(":type", "unknown"))
                
                # If type is a keyword (starts with :), remove the colon for handler lookup
                if isinstance(msg_type, str) and msg_type.startswith(":"):
                    msg_type = msg_type[1:]
                
                # Extract payload with fallbacks for different formats
                payload = message.get("payload", message.get(":payload", {}))
                
                logger.debug(f"Received message - ID: {msg_id}, Type: {msg_type}, Payload: {payload}")
                
                # For EDN format, ensure message type is properly extracted if still unknown
                if client_format == FORMAT_EDN and msg_type == "unknown":
                    # Try to extract type from raw data as a fallback
                    type_match = re.search(r':type\s+"([^"]+)"', data)
                    if type_match:
                        msg_type = type_match.group(1)
                        logger.debug(f"Extracted message type from raw data: {msg_type}")

                # Handle ping messages immediately
                if msg_type == "ping":
                    response = await handle_ping(payload, client_id)
                    await ws_server.send(client_id, {
                        "id": msg_id,
                        "type": "pong",
                        "payload": response
                    })
                    continue

                # Handle other message types
                # First check if the type is in handlers directly
                if msg_type in ws_server.handlers:
                    handler = ws_server.handlers[msg_type]
                    
                    # Process message
                    result = await handler(payload, client_id)
                    
                    # Send response if there's a result
                    if result:
                        await ws_server.send(client_id, {
                            "id": msg_id,
                            "type": "response",
                            "payload": result
                        })
                else:
                    # No handler for this message type
                    logger.warning(f"No handler registered for message type: {msg_type}")
                    await ws_server.send(client_id, {
                        "id": msg_id,
                        "type": "error",
                        "payload": {
                            "error": f"No handler registered for message type: {msg_type}"
                        }
                    })
            except Exception as e:
                logger.error(f"Error handling message: {str(e)}", exc_info=True)
                await ws_server.send(client_id, {
                    "id": "server",
                    "type": "error",
                    "payload": {
                        "error": f"Error processing message: {str(e)}"
                    }
                })

    except WebSocketDisconnect:
        # Client disconnected
        logger.info(f"Client disconnected: {client_id}")
        await ws_server.remove_client(client_id)


# Initialize WebSocket server
ws_server = WebSocketServer()
register_handlers()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="WebSocket Server")
    parser.add_argument("--port", type=int, default=3030, help="Port to run server on")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to run server on")
    args = parser.parse_args()

    print(f"Starting WebSocket server on {args.host}:{args.port}")
    uvicorn.run(app, host=args.host, port=args.port)
