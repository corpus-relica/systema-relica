"""
Shared test fixtures and configuration for NOUS test suite.

This module provides common fixtures for:
- Mock WebSocket servers and clients
- Service client mocking
- Async test utilities
- Test data and configuration
"""

import asyncio
import json
import logging
from typing import Dict, Any, AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import websockets
from websockets.server import WebSocketServerProtocol
from websockets.exceptions import ConnectionClosed

# Configure test logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def mock_websocket_server() -> AsyncGenerator[Dict[str, Any], None]:
    """
    Create a mock WebSocket server for testing.
    
    Returns:
        Dict containing server info: {'host': str, 'port': int, 'server': WebSocketServer}
    """
    host = "localhost"
    port = 0  # Let the OS choose an available port
    connected_clients = set()
    received_messages = []
    
    async def handler(websocket: WebSocketServerProtocol, path: str):
        """Handle WebSocket connections."""
        connected_clients.add(websocket)
        logger.info(f"Client connected: {websocket.remote_address}")
        
        try:
            async for message in websocket:
                logger.info(f"Received message: {message}")
                received_messages.append(message)
                
                # Echo the message back for testing
                await websocket.send(f"Echo: {message}")
                
        except ConnectionClosed:
            logger.info(f"Client disconnected: {websocket.remote_address}")
        finally:
            connected_clients.discard(websocket)
    
    # Start the server
    server = await websockets.serve(handler, host, port)
    actual_port = server.sockets[0].getsockname()[1]
    
    server_info = {
        'host': host,
        'port': actual_port,
        'server': server,
        'connected_clients': connected_clients,
        'received_messages': received_messages,
        'url': f"ws://{host}:{actual_port}"
    }
    
    logger.info(f"Mock WebSocket server started on {host}:{actual_port}")
    
    try:
        yield server_info
    finally:
        server.close()
        await server.wait_closed()
        logger.info("Mock WebSocket server stopped")


@pytest.fixture
async def websocket_client():
    """
    Create a WebSocket client for testing.
    
    Usage:
        async with websocket_client("ws://localhost:8080") as client:
            await client.send("test message")
            response = await client.recv()
    """
    clients = []
    
    async def create_client(uri: str):
        client = await websockets.connect(uri)
        clients.append(client)
        return client
    
    try:
        yield create_client
    finally:
        # Clean up all clients
        for client in clients:
            if not client.closed:
                await client.close()


@pytest.fixture
def mock_aperture_client():
    """Mock the ApertureClient for testing."""
    mock = AsyncMock()
    
    # Configure default return values
    mock.connect.return_value = True
    mock.retrieveEnvironment.return_value = {
        'facts': [
            {'id': 1, 'type': 'test_fact', 'data': 'test_data'}
        ],
        'selected_entity_id': 'test_entity_123'
    }
    mock.listEnvironments.return_value = [
        {'id': 1, 'name': 'test_env', 'user_id': 123}
    ]
    
    return mock


@pytest.fixture
def mock_archivist_client():
    """Mock the ArchivistClient for testing."""
    mock = AsyncMock()
    
    # Configure default return values
    mock.connect.return_value = True
    mock.getKinds.return_value = [
        {'id': 1, 'name': 'test_kind', 'description': 'Test kind'}
    ]
    
    return mock


@pytest.fixture
def mock_clarity_client():
    """Mock the ClarityClient for testing."""
    mock = AsyncMock()
    
    # Configure default return values
    mock.connect.return_value = True
    mock.process_query.return_value = {
        'result': 'test_response',
        'confidence': 0.95
    }
    
    return mock


@pytest.fixture
def mock_semantic_model():
    """Mock the SemanticModel for testing."""
    mock = MagicMock()
    
    # Configure default attributes and methods
    mock.selected_entity = 'test_entity_123'
    mock.addFacts = AsyncMock()
    mock.getFacts.return_value = [
        {'id': 1, 'type': 'test_fact', 'data': 'test_data'}
    ]
    
    return mock


@pytest.fixture
def sample_websocket_message():
    """Sample WebSocket message for testing."""
    return {
        "type": "user-input",
        "user_id": "test_user_123",
        "env_id": "test_env_456", 
        "client_id": "test_client_789",
        "message": "Hello, this is a test message",
        "timestamp": "2025-05-29T17:00:00Z"
    }


@pytest.fixture
def sample_edn_data():
    """Sample EDN data for testing EDN parsing."""
    return '''
    {:type :test-data
     :user-id 123
     :env-id "test-env"
     :facts [{:id 1 :type :entity :name "Test Entity"}
             {:id 2 :type :relation :from 1 :to 3}]}
    '''


@pytest.fixture
def mock_nous_agent():
    """Mock NOUSAgent for testing."""
    mock = AsyncMock()
    
    # Configure default return values
    mock.handleInput.return_value = "This is a test response from the NOUS agent."
    
    return mock


@pytest.fixture
async def test_environment_data():
    """Test environment data for integration tests."""
    return {
        'user_id': 123,
        'env_id': 'test_env_456',
        'client_id': 'test_client_789',
        'facts': [
            {'id': 1, 'type': 'entity', 'name': 'Test Entity', 'properties': {}},
            {'id': 2, 'type': 'relation', 'from': 1, 'to': 3, 'label': 'test_relation'}
        ],
        'selected_entity_id': 'test_entity_123'
    }


@pytest.fixture(autouse=True)
def suppress_logs():
    """Suppress noisy logs during testing."""
    # Suppress EDN format logs
    logging.getLogger("edn_format").setLevel(logging.WARNING)
    # Suppress websockets logs
    logging.getLogger("websockets").setLevel(logging.WARNING)


# Async test utilities
class AsyncTestUtils:
    """Utility class for async testing helpers."""
    
    @staticmethod
    async def wait_for_condition(condition_func, timeout=5.0, interval=0.1):
        """Wait for a condition to become true."""
        start_time = asyncio.get_event_loop().time()
        
        while True:
            if condition_func():
                return True
                
            if asyncio.get_event_loop().time() - start_time > timeout:
                return False
                
            await asyncio.sleep(interval)
    
    @staticmethod
    async def collect_messages(websocket, count=1, timeout=5.0):
        """Collect a specific number of messages from a WebSocket."""
        messages = []
        
        try:
            for _ in range(count):
                message = await asyncio.wait_for(websocket.recv(), timeout=timeout)
                messages.append(message)
        except asyncio.TimeoutError:
            logger.warning(f"Timeout waiting for messages. Got {len(messages)}/{count}")
        
        return messages


@pytest.fixture
def async_test_utils():
    """Provide async test utilities."""
    return AsyncTestUtils 