"""
WebSocket testing utilities for NOUS test suite.

This module provides utilities for:
- Mock WebSocket server creation
- WebSocket client testing helpers
- Message validation and contract testing
- Async connection lifecycle testing
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional, Callable, Union
from unittest.mock import AsyncMock, MagicMock

import websockets
from websockets.server import WebSocketServerProtocol
from websockets.exceptions import ConnectionClosed, WebSocketException

logger = logging.getLogger(__name__)


class MockWebSocketServer:
    """Mock WebSocket server for testing."""
    
    def __init__(self, host: str = "localhost", port: int = 0):
        self.host = host
        self.port = port
        self.server = None
        self.actual_port = None
        self.connected_clients = set()
        self.received_messages = []
        self.message_handlers = {}
        self.connection_callbacks = []
        self.disconnection_callbacks = []
    
    async def start(self):
        """Start the mock WebSocket server."""
        self.server = await websockets.serve(self._handler, self.host, self.port)
        self.actual_port = self.server.sockets[0].getsockname()[1]
        logger.info(f"Mock WebSocket server started on {self.host}:{self.actual_port}")
    
    async def stop(self):
        """Stop the mock WebSocket server."""
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            logger.info("Mock WebSocket server stopped")
    
    @property
    def url(self) -> str:
        """Get the WebSocket URL."""
        return f"ws://{self.host}:{self.actual_port}"
    
    def register_message_handler(self, message_type: str, handler: Callable):
        """Register a handler for specific message types."""
        self.message_handlers[message_type] = handler
    
    def add_connection_callback(self, callback: Callable):
        """Add a callback for new connections."""
        self.connection_callbacks.append(callback)
    
    def add_disconnection_callback(self, callback: Callable):
        """Add a callback for disconnections."""
        self.disconnection_callbacks.append(callback)
    
    async def _handler(self, websocket: WebSocketServerProtocol, path: str):
        """Handle WebSocket connections."""
        self.connected_clients.add(websocket)
        logger.info(f"Client connected: {websocket.remote_address}")
        
        # Call connection callbacks
        for callback in self.connection_callbacks:
            await callback(websocket, path)
        
        try:
            async for message in websocket:
                logger.info(f"Received message: {message}")
                self.received_messages.append(message)
                
                # Try to parse as JSON and handle by type
                try:
                    parsed_message = json.loads(message)
                    message_type = parsed_message.get('type')
                    
                    if message_type in self.message_handlers:
                        response = await self.message_handlers[message_type](parsed_message, websocket)
                        if response:
                            await websocket.send(json.dumps(response))
                    else:
                        # Default echo behavior
                        await websocket.send(f"Echo: {message}")
                        
                except json.JSONDecodeError:
                    # Handle non-JSON messages
                    await websocket.send(f"Echo: {message}")
                
        except ConnectionClosed:
            logger.info(f"Client disconnected: {websocket.remote_address}")
        except Exception as e:
            logger.error(f"Error in WebSocket handler: {e}")
        finally:
            self.connected_clients.discard(websocket)
            
            # Call disconnection callbacks
            for callback in self.disconnection_callbacks:
                await callback(websocket)
    
    async def broadcast(self, message: Union[str, Dict]):
        """Broadcast a message to all connected clients."""
        if isinstance(message, dict):
            message = json.dumps(message)
        
        if self.connected_clients:
            await asyncio.gather(
                *[client.send(message) for client in self.connected_clients],
                return_exceptions=True
            )


class WebSocketTestClient:
    """WebSocket test client with utilities for testing."""
    
    def __init__(self, uri: str):
        self.uri = uri
        self.websocket = None
        self.received_messages = []
        self.is_connected = False
    
    async def connect(self):
        """Connect to the WebSocket server."""
        try:
            self.websocket = await websockets.connect(self.uri)
            self.is_connected = True
            logger.info(f"Connected to {self.uri}")
        except Exception as e:
            logger.error(f"Failed to connect to {self.uri}: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from the WebSocket server."""
        if self.websocket and not self.websocket.closed:
            await self.websocket.close()
            self.is_connected = False
            logger.info(f"Disconnected from {self.uri}")
    
    async def send_message(self, message: Union[str, Dict]):
        """Send a message to the server."""
        if not self.is_connected:
            raise RuntimeError("Not connected to WebSocket server")
        
        if isinstance(message, dict):
            message = json.dumps(message)
        
        await self.websocket.send(message)
        logger.info(f"Sent message: {message}")
    
    async def receive_message(self, timeout: float = 5.0) -> str:
        """Receive a message from the server."""
        if not self.is_connected:
            raise RuntimeError("Not connected to WebSocket server")
        
        try:
            message = await asyncio.wait_for(self.websocket.recv(), timeout=timeout)
            self.received_messages.append(message)
            logger.info(f"Received message: {message}")
            return message
        except asyncio.TimeoutError:
            logger.warning(f"Timeout waiting for message after {timeout}s")
            raise
    
    async def receive_json_message(self, timeout: float = 5.0) -> Dict:
        """Receive and parse a JSON message from the server."""
        message = await self.receive_message(timeout)
        try:
            return json.loads(message)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON message: {message}")
            raise
    
    async def send_and_receive(self, message: Union[str, Dict], timeout: float = 5.0) -> str:
        """Send a message and wait for a response."""
        await self.send_message(message)
        return await self.receive_message(timeout)
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.disconnect()


class MessageValidator:
    """Utilities for validating WebSocket message contracts."""
    
    @staticmethod
    def validate_user_input_message(message: Dict) -> bool:
        """Validate a user input message structure."""
        required_fields = ['type', 'user_id', 'env_id', 'client_id', 'message']
        
        if not isinstance(message, dict):
            return False
        
        for field in required_fields:
            if field not in message:
                logger.error(f"Missing required field: {field}")
                return False
        
        if message['type'] != 'user-input':
            logger.error(f"Invalid message type: {message['type']}")
            return False
        
        return True
    
    @staticmethod
    def validate_final_answer_message(message: Dict) -> bool:
        """Validate a final answer message structure."""
        required_fields = ['type', 'client_id', 'answer']
        
        if not isinstance(message, dict):
            return False
        
        for field in required_fields:
            if field not in message:
                logger.error(f"Missing required field: {field}")
                return False
        
        if message['type'] != 'final-answer':
            logger.error(f"Invalid message type: {message['type']}")
            return False
        
        return True
    
    @staticmethod
    def validate_error_message(message: Dict) -> bool:
        """Validate an error message structure."""
        required_fields = ['type', 'client_id', 'error']
        
        if not isinstance(message, dict):
            return False
        
        for field in required_fields:
            if field not in message:
                logger.error(f"Missing required field: {field}")
                return False
        
        if message['type'] != 'error':
            logger.error(f"Invalid message type: {message['type']}")
            return False
        
        return True


class WebSocketTestScenario:
    """Helper class for running WebSocket test scenarios."""
    
    def __init__(self, server: MockWebSocketServer):
        self.server = server
        self.clients = []
    
    async def add_client(self, client_id: str = None) -> WebSocketTestClient:
        """Add a test client to the scenario."""
        client = WebSocketTestClient(self.server.url)
        await client.connect()
        self.clients.append(client)
        return client
    
    async def cleanup(self):
        """Clean up all clients and server."""
        for client in self.clients:
            await client.disconnect()
        await self.server.stop()
    
    async def simulate_user_interaction(self, user_id: str, env_id: str, message: str) -> Dict:
        """Simulate a complete user interaction scenario."""
        client = await self.add_client()
        
        # Send user input message
        user_message = {
            'type': 'user-input',
            'user_id': user_id,
            'env_id': env_id,
            'client_id': 'test_client',
            'message': message
        }
        
        await client.send_message(user_message)
        
        # Wait for response
        response = await client.receive_json_message()
        
        return response


# Test data generators
def generate_test_user_message(user_id: str = "test_user", env_id: str = "test_env", 
                              message: str = "Hello, test message") -> Dict:
    """Generate a test user input message."""
    return {
        'type': 'user-input',
        'user_id': user_id,
        'env_id': env_id,
        'client_id': 'test_client',
        'message': message,
        'timestamp': '2025-05-29T17:00:00Z'
    }


def generate_test_final_answer(client_id: str = "test_client", 
                              answer: str = "Test response") -> Dict:
    """Generate a test final answer message."""
    return {
        'type': 'final-answer',
        'client_id': client_id,
        'answer': answer,
        'timestamp': '2025-05-29T17:00:00Z'
    }


def generate_test_error_message(client_id: str = "test_client", 
                               error: str = "Test error") -> Dict:
    """Generate a test error message."""
    return {
        'type': 'error',
        'client_id': client_id,
        'error': error,
        'timestamp': '2025-05-29T17:00:00Z'
    } 