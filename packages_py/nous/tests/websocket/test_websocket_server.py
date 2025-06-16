"""
WebSocket server tests for NOUS WebSocket infrastructure.

Tests WebSocket connection handling, message processing, and protocol compliance.
"""

import asyncio
import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from tests.utils.websocket_utils import (
    MockWebSocketServer,
    WebSocketTestClient,
    MessageValidator,
    WebSocketTestScenario,
    generate_test_user_message,
    generate_test_final_answer
)


@pytest.mark.websocket
@pytest.mark.asyncio
class TestWebSocketServer:
    """Test WebSocket server functionality."""
    
    async def test_websocket_server_startup_shutdown(self):
        """Test WebSocket server can start and stop properly."""
        server = MockWebSocketServer()
        
        # Start server
        await server.start()
        assert server.server is not None
        assert server.actual_port is not None
        assert server.url.startswith("ws://localhost:")
        
        # Stop server
        await server.stop()
    
    async def test_websocket_client_connection(self):
        """Test WebSocket client can connect to server."""
        server = MockWebSocketServer()
        await server.start()
        
        try:
            client = WebSocketTestClient(server.url)
            await client.connect()
            
            assert client.is_connected
            assert len(server.connected_clients) == 1
            
            await client.disconnect()
            assert not client.is_connected
            
        finally:
            await server.stop()
    
    async def test_websocket_message_echo(self):
        """Test basic message echo functionality."""
        server = MockWebSocketServer()
        await server.start()
        
        try:
            client = WebSocketTestClient(server.url)
            await client.connect()
            
            # Send a message and receive echo
            test_message = "Hello, WebSocket!"
            response = await client.send_and_receive(test_message)
            
            assert response == f"Echo: {test_message}"
            assert len(server.received_messages) == 1
            assert server.received_messages[0] == test_message
            
            await client.disconnect()
            
        finally:
            await server.stop()
    
    async def test_websocket_json_message_handling(self):
        """Test JSON message handling."""
        server = MockWebSocketServer()
        
        # Register a custom handler for user-input messages
        async def handle_user_input(message, websocket):
            return {
                "type": "final-answer",
                "client_id": message["client_id"],
                "answer": f"Processed: {message['message']}"
            }
        
        server.register_message_handler("user-input", handle_user_input)
        await server.start()
        
        try:
            client = WebSocketTestClient(server.url)
            await client.connect()
            
            # Send a user input message
            user_message = generate_test_user_message(
                user_id="test_user",
                env_id="test_env",
                message="Hello from test"
            )
            
            await client.send_message(user_message)
            response = await client.receive_json_message()
            
            assert response["type"] == "final-answer"
            assert response["client_id"] == "test_client"
            assert "Processed: Hello from test" in response["answer"]
            
            await client.disconnect()
            
        finally:
            await server.stop()
    
    async def test_multiple_client_connections(self):
        """Test multiple clients can connect simultaneously."""
        server = MockWebSocketServer()
        await server.start()
        
        try:
            clients = []
            num_clients = 3
            
            # Connect multiple clients
            for i in range(num_clients):
                client = WebSocketTestClient(server.url)
                await client.connect()
                clients.append(client)
            
            assert len(server.connected_clients) == num_clients
            
            # Send messages from each client
            for i, client in enumerate(clients):
                message = f"Message from client {i}"
                response = await client.send_and_receive(message)
                assert response == f"Echo: {message}"
            
            # Disconnect all clients
            for client in clients:
                await client.disconnect()
            
            assert len(server.connected_clients) == 0
            
        finally:
            await server.stop()
    
    async def test_websocket_broadcast_functionality(self):
        """Test server can broadcast messages to all clients."""
        server = MockWebSocketServer()
        await server.start()
        
        try:
            clients = []
            num_clients = 3
            
            # Connect multiple clients
            for i in range(num_clients):
                client = WebSocketTestClient(server.url)
                await client.connect()
                clients.append(client)
            
            # Broadcast a message
            broadcast_message = {"type": "broadcast", "message": "Hello everyone!"}
            await server.broadcast(broadcast_message)
            
            # Each client should receive the broadcast
            for client in clients:
                response = await client.receive_json_message()
                assert response["type"] == "broadcast"
                assert response["message"] == "Hello everyone!"
            
            # Disconnect all clients
            for client in clients:
                await client.disconnect()
            
        finally:
            await server.stop()


@pytest.mark.websocket
@pytest.mark.asyncio
class TestWebSocketMessageValidation:
    """Test WebSocket message validation and contracts."""
    
    def test_user_input_message_validation(self):
        """Test user input message validation."""
        # Valid message
        valid_message = generate_test_user_message()
        assert MessageValidator.validate_user_input_message(valid_message)
        
        # Invalid messages
        invalid_messages = [
            {},  # Empty dict
            {"type": "user-input"},  # Missing required fields
            {"type": "wrong-type", "user_id": "test", "env_id": "test", "client_id": "test", "message": "test"},  # Wrong type
            "not a dict",  # Not a dict
        ]
        
        for invalid_msg in invalid_messages:
            assert not MessageValidator.validate_user_input_message(invalid_msg)
    
    def test_final_answer_message_validation(self):
        """Test final answer message validation."""
        # Valid message
        valid_message = generate_test_final_answer()
        assert MessageValidator.validate_final_answer_message(valid_message)
        
        # Invalid messages
        invalid_messages = [
            {},  # Empty dict
            {"type": "final-answer"},  # Missing required fields
            {"type": "wrong-type", "client_id": "test", "answer": "test"},  # Wrong type
            "not a dict",  # Not a dict
        ]
        
        for invalid_msg in invalid_messages:
            assert not MessageValidator.validate_final_answer_message(invalid_msg)
    
    async def test_message_contract_compliance(self):
        """Test that WebSocket messages comply with expected contracts."""
        server = MockWebSocketServer()
        
        # Register handler that validates incoming messages
        received_valid_messages = []
        
        async def validate_and_handle(message, websocket):
            if MessageValidator.validate_user_input_message(message):
                received_valid_messages.append(message)
                return generate_test_final_answer(
                    client_id=message["client_id"],
                    answer="Message validated and processed"
                )
            else:
                return {
                    "type": "error",
                    "client_id": message.get("client_id", "unknown"),
                    "error": "Invalid message format"
                }
        
        server.register_message_handler("user-input", validate_and_handle)
        await server.start()
        
        try:
            client = WebSocketTestClient(server.url)
            await client.connect()
            
            # Send valid message
            valid_message = generate_test_user_message()
            await client.send_message(valid_message)
            response = await client.receive_json_message()
            
            assert response["type"] == "final-answer"
            assert "validated and processed" in response["answer"]
            assert len(received_valid_messages) == 1
            
            await client.disconnect()
            
        finally:
            await server.stop()


@pytest.mark.websocket
@pytest.mark.asyncio
class TestWebSocketScenarios:
    """Test complete WebSocket interaction scenarios."""
    
    async def test_user_interaction_scenario(self):
        """Test a complete user interaction scenario."""
        server = MockWebSocketServer()
        
        # Mock the NOUS agent response
        async def mock_nous_handler(message, websocket):
            if message["type"] == "user-input":
                return {
                    "type": "final-answer",
                    "client_id": message["client_id"],
                    "answer": f"NOUS processed: {message['message']}"
                }
        
        server.register_message_handler("user-input", mock_nous_handler)
        await server.start()
        
        try:
            scenario = WebSocketTestScenario(server)
            
            # Simulate user interaction
            response = await scenario.simulate_user_interaction(
                user_id="test_user_123",
                env_id="test_env_456",
                message="What is the meaning of life?"
            )
            
            assert response["type"] == "final-answer"
            assert "NOUS processed" in response["answer"]
            assert "What is the meaning of life?" in response["answer"]
            
            await scenario.cleanup()
            
        finally:
            await server.stop()
    
    async def test_connection_lifecycle(self):
        """Test WebSocket connection lifecycle events."""
        server = MockWebSocketServer()
        
        connection_events = []
        disconnection_events = []
        
        async def on_connect(websocket, path):
            connection_events.append(f"Connected: {websocket.remote_address}")
        
        async def on_disconnect(websocket):
            disconnection_events.append(f"Disconnected: {websocket.remote_address}")
        
        server.add_connection_callback(on_connect)
        server.add_disconnection_callback(on_disconnect)
        await server.start()
        
        try:
            # Connect and disconnect a client
            client = WebSocketTestClient(server.url)
            await client.connect()
            await asyncio.sleep(0.1)  # Allow callbacks to execute
            await client.disconnect()
            await asyncio.sleep(0.1)  # Allow callbacks to execute
            
            assert len(connection_events) == 1
            assert len(disconnection_events) == 1
            assert "Connected:" in connection_events[0]
            assert "Disconnected:" in disconnection_events[0]
            
        finally:
            await server.stop()
    
    @pytest.mark.slow
    async def test_websocket_stress_test(self):
        """Test WebSocket server under load."""
        server = MockWebSocketServer()
        await server.start()
        
        try:
            num_clients = 10
            messages_per_client = 5
            clients = []
            
            # Connect multiple clients
            for i in range(num_clients):
                client = WebSocketTestClient(server.url)
                await client.connect()
                clients.append(client)
            
            # Send multiple messages from each client concurrently
            async def send_messages(client, client_id):
                for i in range(messages_per_client):
                    message = f"Message {i} from client {client_id}"
                    await client.send_message(message)
                    await client.receive_message()  # Wait for echo
            
            # Run all clients concurrently
            tasks = [
                send_messages(client, i) 
                for i, client in enumerate(clients)
            ]
            await asyncio.gather(*tasks)
            
            # Verify all messages were received
            expected_total_messages = num_clients * messages_per_client
            assert len(server.received_messages) == expected_total_messages
            
            # Disconnect all clients
            for client in clients:
                await client.disconnect()
            
        finally:
            await server.stop()


@pytest.mark.websocket
@pytest.mark.integration
@pytest.mark.asyncio
class TestWebSocketIntegration:
    """Integration tests for WebSocket functionality with other components."""
    
    async def test_websocket_with_mock_services(self, mock_aperture_client, mock_nous_agent):
        """Test WebSocket integration with mocked services."""
        server = MockWebSocketServer()
        
        # Handler that simulates the real NOUS server behavior
        async def integrated_handler(message, websocket):
            if message["type"] == "user-input":
                # Simulate service calls
                await mock_aperture_client.retrieveEnvironment(1, None)
                response = await mock_nous_agent.handleInput([{"role": "user", "content": message["message"]}])
                
                return {
                    "type": "final-answer",
                    "client_id": message["client_id"],
                    "answer": response
                }
        
        server.register_message_handler("user-input", integrated_handler)
        await server.start()
        
        try:
            client = WebSocketTestClient(server.url)
            await client.connect()
            
            user_message = generate_test_user_message(message="Test integration")
            await client.send_message(user_message)
            response = await client.receive_json_message()
            
            assert response["type"] == "final-answer"
            assert response["answer"] == "This is a test response from the NOUS agent."
            
            # Verify service calls were made
            mock_aperture_client.retrieveEnvironment.assert_called_once()
            mock_nous_agent.handleInput.assert_called_once()
            
            await client.disconnect()
            
        finally:
            await server.stop() 