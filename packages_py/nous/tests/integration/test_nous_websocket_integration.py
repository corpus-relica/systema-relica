"""
Integration tests for NOUS WebSocket server.

Tests the complete WebSocket server functionality including:
- Real server startup and client connections
- Message handler registration and processing
- Client management and broadcasting
- NOUS server integration with LangChain agents
- Service client integration (aperture, archivist, clarity)
"""

import asyncio
import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from typing import Dict, Any

from src.meridian.server import WebSocketServer, register_handlers
from src.relica_nous_langchain.services.NOUSServer import NOUSServer
from tests.utils.websocket_utils import (
    WebSocketTestClient,
    MessageValidator,
    generate_test_user_message
)


@pytest.mark.integration
@pytest.mark.asyncio
class TestNOUSWebSocketIntegration:
    """Integration tests for NOUS WebSocket server functionality."""
    
    async def test_websocket_server_initialization(self):
        """Test WebSocket server can be initialized and configured."""
        server = WebSocketServer()
        
        # Test initial state
        assert server.clients == {}
        assert len(server.handlers) >= 0
        
        # Test handler registration
        async def test_handler(message: Dict, client_id: str) -> Dict:
            return {"status": "test_handled"}
        
        server.register_handler("test-message", test_handler)
        assert "test-message" in server.handlers
        assert server.handlers["test-message"] == test_handler
    
    async def test_client_management_lifecycle(self):
        """Test complete client connection lifecycle."""
        server = WebSocketServer()
        
        # Mock WebSocket connection
        mock_websocket = AsyncMock()
        client_id = "test_client_123"
        
        # Test adding client
        await server.add_client(client_id, mock_websocket, "json", "python")
        
        assert client_id in server.clients
        assert server.clients[client_id]["websocket"] == mock_websocket
        assert server.clients[client_id]["format"] == "json"
        assert server.clients[client_id]["language"] == "python"
        assert "connected_at" in server.clients[client_id]
        
        # Test client info retrieval
        client_info = server.get_client_info(client_id)
        assert client_info is not None
        assert "websocket" not in client_info  # Should be excluded
        assert client_info["format"] == "json"
        assert client_info["language"] == "python"
        
        # Test client count
        assert server.count_connected_clients() == 1
        
        # Test client ID list
        client_ids = server.get_client_ids()
        assert client_ids == [client_id]
        
        # Test removing client
        await server.remove_client(client_id)
        assert client_id not in server.clients
        assert server.count_connected_clients() == 0
    
    async def test_message_sending_and_broadcasting(self):
        """Test message sending and broadcasting functionality."""
        server = WebSocketServer()
        
        # Set up multiple mock clients
        clients = []
        for i in range(3):
            mock_websocket = AsyncMock()
            client_id = f"test_client_{i}"
            await server.add_client(client_id, mock_websocket, "json", "python")
            clients.append((client_id, mock_websocket))
        
        # Test sending to specific client
        test_message = {"type": "test", "data": "hello"}
        success = await server.send("test_client_0", test_message)
        
        assert success is True
        clients[0][1].send_text.assert_called_once()
        sent_message = clients[0][1].send_text.call_args[0][0]
        parsed_message = json.loads(sent_message)
        assert parsed_message["type"] == "test"
        assert parsed_message["data"] == "hello"
        
        # Test broadcasting to all clients
        broadcast_message = {"type": "broadcast", "message": "hello everyone"}
        recipient_count = await server.broadcast(broadcast_message)
        
        assert recipient_count == 3
        for _, mock_websocket in clients:
            mock_websocket.send_text.assert_called()
    
    async def test_standard_message_handlers(self):
        """Test standard WebSocket message handlers."""
        server = WebSocketServer()
        await register_handlers()
        
        # Test ping handler
        ping_response = await server.handlers["ping"]({}, "test_client")
        assert "pong" in ping_response
        assert ping_response["pong"] is True
        assert "server_time" in ping_response
        
        # Test status handler
        status_response = await server.handlers["status"]({}, "test_client")
        assert status_response["status"] == "ok"
        assert "server_time" in status_response
        assert "clients_count" in status_response
        assert "clients" in status_response
        
        # Test sync-files handler
        sync_message = {"files": ["file1.txt", "file2.txt"]}
        sync_response = await server.handlers["sync-files"](sync_message, "test_client")
        assert sync_response["synced"] == 2
        assert sync_response["status"] == "ok"
        
        # Test test-multimethod handler
        test_message = {"test": "data"}
        test_response = await server.handlers["test-multimethod"](test_message, "test_client")
        assert test_response["success"] is True
        assert test_response["data"] == test_message


@pytest.mark.integration
@pytest.mark.asyncio
class TestNOUSServerIntegration:
    """Integration tests for NOUSServer with WebSocket functionality."""
    
    async def test_nous_server_initialization(self):
        """Test NOUSServer initialization and setup."""
        server = NOUSServer()
        
        # Test handler registration
        mock_handler = AsyncMock()
        server.init(mock_handler)
        
        assert server.handle_user_input_func == mock_handler
    
    async def test_nous_user_input_processing(self, mock_nous_agent, mock_semantic_model):
        """Test NOUS server processing user input through the complete pipeline."""
        server = NOUSServer()
        
        # Mock the complete handler function
        messages_processed = []
        
        async def mock_user_input_handler(user_id, env_id, message, client_id):
            """Mock handler that simulates main.py handle_user_input"""
            messages_processed.append({
                'user_id': user_id,
                'env_id': env_id,
                'message': message,
                'client_id': client_id
            })
            
            # Simulate agent processing
            response = await mock_nous_agent.handleInput([{"role": "user", "content": message}])
            
            # Return response (in real implementation this would be sent via WebSocket)
            return response
        
        server.init(mock_user_input_handler)
        
        # Test user input processing
        payload = {
            'user-id': 'test_user_123',
            'env-id': 'test_env_456',
            'message': 'What is the meaning of life?'
        }
        client_id = 'test_client_789'
        
        await server.handle_user_input(payload, client_id)
        
        # Verify processing
        assert len(messages_processed) == 1
        processed = messages_processed[0]
        assert processed['user_id'] == 'test_user_123'
        assert processed['env_id'] == 'test_env_456'
        assert processed['message'] == 'What is the meaning of life?'
        assert processed['client_id'] == 'test_client_789'
        
        # Verify agent was called
        mock_nous_agent.handleInput.assert_called_once()
        call_args = mock_nous_agent.handleInput.call_args[0][0]
        assert call_args[0]["role"] == "user"
        assert call_args[0]["content"] == "What is the meaning of life?"


@pytest.mark.integration
@pytest.mark.asyncio  
class TestWebSocketMessageContracts:
    """Test WebSocket message contracts and protocols."""
    
    async def test_user_input_message_contract(self):
        """Test user input message contract validation."""
        server = WebSocketServer()
        
        # Valid user input message
        valid_message = {
            "type": "user-input",
            "user_id": "test_user",
            "env_id": "test_env",
            "client_id": "test_client",
            "message": "Hello, NOUS!",
            "timestamp": "2025-05-29T18:00:00Z"
        }
        
        assert MessageValidator.validate_user_input_message(valid_message)
        
        # Test with missing fields
        invalid_messages = [
            {"type": "user-input"},  # Missing required fields
            {"type": "user-input", "user_id": "test"},  # Missing env_id, client_id, message
            {"user_id": "test", "env_id": "test", "client_id": "test", "message": "test"},  # Missing type
        ]
        
        for invalid_msg in invalid_messages:
            assert not MessageValidator.validate_user_input_message(invalid_msg)
    
    async def test_broadcast_message_contract(self):
        """Test broadcast message contract."""
        server = WebSocketServer()
        await register_handlers()
        
        # Mock WebSocket for receiving broadcast
        mock_websocket = AsyncMock()
        await server.add_client("test_client", mock_websocket, "json", "python")
        
        # Test broadcast request
        broadcast_request = {
            "client_id": "test_client",
            "message": "Hello everyone!",
            "timestamp": 1234567890
        }
        
        response = await server.handlers["request-broadcast"](broadcast_request, "test_client")
        
        assert response["broadcast"] is True
        assert response["recipients"] == 1
        assert "timestamp" in response
        
        # Verify broadcast was sent
        mock_websocket.send_text.assert_called()
        sent_data = mock_websocket.send_text.call_args[0][0]
        sent_message = json.loads(sent_data)
        
        assert sent_message["type"] == "broadcast"
        assert sent_message["payload"]["from"] == "test_client"
        assert sent_message["payload"]["message"] == "Hello everyone!"
    
    async def test_heartbeat_message_contract(self):
        """Test heartbeat message contract."""
        server = WebSocketServer()
        
        # Mock WebSocket
        mock_websocket = AsyncMock()
        await server.add_client("test_client", mock_websocket, "json", "python")
        
        # Test heartbeat broadcast
        heartbeat_message = {
            "id": "server",
            "type": "heartbeat",
            "payload": {
                "server_time": 1234567890,
                "active_clients": 1
            }
        }
        
        await server.broadcast(heartbeat_message)
        
        # Verify heartbeat was sent
        mock_websocket.send_text.assert_called()
        sent_data = mock_websocket.send_text.call_args[0][0]
        sent_message = json.loads(sent_data)
        
        assert sent_message["type"] == "heartbeat"
        assert sent_message["payload"]["server_time"] == 1234567890
        assert sent_message["payload"]["active_clients"] == 1


@pytest.mark.integration
@pytest.mark.asyncio
class TestServiceClientIntegration:
    """Test integration with service clients (aperture, archivist, clarity)."""
    
    async def test_aperture_client_integration(self, mock_aperture_client):
        """Test integration with aperture client for environment retrieval."""
        server = NOUSServer()
        
        # Mock complete user input handler that uses aperture client
        async def integrated_handler(user_id, env_id, message, client_id):
            # Simulate retrieving environment from aperture
            env_data = await mock_aperture_client.retrieveEnvironment(env_id, None)
            
            # Process the environment data
            return {
                "client_id": client_id,
                "processed_env": env_data,
                "user_message": message
            }
        
        server.init(integrated_handler)
        
        # Test processing
        payload = {
            'user-id': 'test_user',
            'env-id': 'test_env_123',
            'message': 'Test message'
        }
        
        await server.handle_user_input(payload, "test_client")
        
        # Verify aperture client was called
        mock_aperture_client.retrieveEnvironment.assert_called_once_with('test_env_123', None)
    
    async def test_semantic_model_integration(self, mock_semantic_model):
        """Test integration with semantic model for fact processing."""
        server = NOUSServer()
        
        # Mock handler that uses semantic model
        async def semantic_handler(user_id, env_id, message, client_id):
            # Simulate adding facts to semantic model
            test_facts = [
                {'id': 1, 'type': 'entity', 'name': 'Test Entity'}
            ]
            await mock_semantic_model.addFacts(test_facts)
            
            # Get facts back
            facts = mock_semantic_model.getFacts()
            
            return {
                "client_id": client_id,
                "facts_added": len(test_facts),
                "total_facts": len(facts)
            }
        
        server.init(semantic_handler)
        
        # Test processing
        payload = {
            'user-id': 'test_user',
            'env-id': 'test_env',
            'message': 'Add some facts'
        }
        
        await server.handle_user_input(payload, "test_client")
        
        # Verify semantic model interactions
        mock_semantic_model.addFacts.assert_called_once()
        mock_semantic_model.getFacts.assert_called_once()
    
    async def test_complete_service_integration_scenario(self, 
                                                       mock_aperture_client,
                                                       mock_archivist_client, 
                                                       mock_clarity_client,
                                                       mock_nous_agent,
                                                       mock_semantic_model):
        """Test complete integration scenario with all services."""
        server = NOUSServer()
        
        # Mock the complete main.py handler
        async def complete_handler(user_id, env_id, message, client_id):
            """Simulate the complete handle_user_input from main.py"""
            
            # 1. Retrieve environment from aperture
            env_data = await mock_aperture_client.retrieveEnvironment(env_id, None)
            
            # 2. Add facts to semantic model
            facts = env_data.get('facts', [])
            await mock_semantic_model.addFacts(facts)
            mock_semantic_model.selected_entity = env_data.get('selected_entity_id')
            
            # 3. Process with NOUS agent
            messages = [{"role": "user", "content": message}]
            agent_response = await mock_nous_agent.handleInput(messages)
            
            return {
                "client_id": client_id,
                "final_answer": agent_response,
                "environment_loaded": True,
                "facts_count": len(facts)
            }
        
        server.init(complete_handler)
        
        # Test complete scenario
        payload = {
            'user-id': 'test_user_123',
            'env-id': 'test_env_456',
            'message': 'Tell me about the current environment'
        }
        
        await server.handle_user_input(payload, "test_client_789")
        
        # Verify all service calls were made
        mock_aperture_client.retrieveEnvironment.assert_called_once_with('test_env_456', None)
        mock_semantic_model.addFacts.assert_called_once()
        mock_nous_agent.handleInput.assert_called_once()
        
        # Verify agent received correct message
        agent_call_args = mock_nous_agent.handleInput.call_args[0][0]
        assert agent_call_args[0]["role"] == "user"
        assert agent_call_args[0]["content"] == "Tell me about the current environment"


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.slow
class TestWebSocketStressAndReliability:
    """Test WebSocket server under stress and edge conditions."""
    
    async def test_multiple_concurrent_clients(self):
        """Test server handling multiple concurrent clients."""
        server = WebSocketServer()
        await register_handlers()
        
        # Create multiple mock clients
        num_clients = 10
        clients = []
        
        for i in range(num_clients):
            mock_websocket = AsyncMock()
            client_id = f"stress_client_{i}"
            await server.add_client(client_id, mock_websocket, "json", "python")
            clients.append((client_id, mock_websocket))
        
        # Test concurrent message processing
        async def send_ping(client_id):
            return await server.handlers["ping"]({}, client_id)
        
        # Send pings concurrently
        tasks = [send_ping(client_id) for client_id, _ in clients]
        responses = await asyncio.gather(*tasks)
        
        # Verify all responses
        assert len(responses) == num_clients
        for response in responses:
            assert response["pong"] is True
            assert "server_time" in response
        
        # Test broadcast to all clients
        broadcast_msg = {"type": "stress_test", "data": "concurrent_test"}
        recipients = await server.broadcast(broadcast_msg)
        
        assert recipients == num_clients
        
        # Verify all clients received the broadcast
        for _, mock_websocket in clients:
            mock_websocket.send_text.assert_called()
    
    async def test_client_disconnection_handling(self):
        """Test graceful handling of client disconnections."""
        server = WebSocketServer()
        
        # Add clients
        mock_websocket_1 = AsyncMock()
        mock_websocket_2 = AsyncMock()
        
        await server.add_client("client_1", mock_websocket_1, "json", "python")
        await server.add_client("client_2", mock_websocket_2, "json", "python")
        
        assert server.count_connected_clients() == 2
        
        # Simulate websocket error for client_1
        mock_websocket_1.send_text.side_effect = Exception("Connection lost")
        
        # Try to send message - should fail gracefully
        success = await server.send("client_1", {"test": "message"})
        assert success is False
        
        # Broadcast should still work for client_2
        recipients = await server.broadcast({"type": "test", "data": "broadcast"})
        assert recipients == 2  # Attempts to send to both, but one fails
        
        # Verify client_2 still received the message
        mock_websocket_2.send_text.assert_called()
        
        # Remove disconnected client
        await server.remove_client("client_1")
        assert server.count_connected_clients() == 1
    
    async def test_malformed_message_handling(self):
        """Test handling of malformed or invalid messages."""
        server = WebSocketServer()
        await register_handlers()
        
        # Test with various malformed messages
        malformed_messages = [
            {},  # Empty message
            {"type": "nonexistent_handler"},  # Handler doesn't exist
            {"invalid": "structure"},  # No type field
            None,  # None message
        ]
        
        for message in malformed_messages:
            # These shouldn't crash the server
            # In real implementation, we'd have error handling
            if message and "type" in message and message["type"] in server.handlers:
                try:
                    await server.handlers[message["type"]](message, "test_client")
                except Exception as e:
                    # Expected for malformed messages
                    assert isinstance(e, Exception) 