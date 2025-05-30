#!/usr/bin/env python3
"""
Comprehensive unit tests for ClarityClient service.
Phase 3B: High-impact coverage for semantic processing and knowledge functions.

Coverage target: 144 lines (0% → 80% coverage improvement)
Test categories: Connection, message handling, API methods, proxy patterns
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch, call
import os

# Import the classes to test
from src.relica_nous_langchain.services.clarity_client import (
    ClarityClient, 
    ClarityClientProxy,
    clarity_client
)

# Helper function to create a proper mock for WebSocketClient
def create_websocket_mock():
    """Create a properly configured WebSocketClient mock with decorator support."""
    mock_client = MagicMock()
    
    # Make on_message return a decorator function
    def on_message_decorator(message_type):
        def decorator(func):
            # Store the handler for potential testing
            return func
        return decorator
    
    mock_client.on_message = MagicMock(side_effect=on_message_decorator)
    
    # Mock other async methods
    mock_client.connect = AsyncMock(return_value=True)
    mock_client.disconnect = AsyncMock()
    mock_client.send = AsyncMock()
    
    return mock_client

@pytest.mark.asyncio
@pytest.mark.unit
class TestClarityClientInitialization:
    """Test ClarityClient initialization and basic setup."""

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    @patch.dict('os.environ', {
        'CLARITY_HOST': 'test-clarity.com',
        'CLARITY_PORT': '3001',
        'CLARITY_PATH': '/test-ws'
    })
    def test_clarity_client_initialization(self, mock_websocket):
        """Test ClarityClient initializes with correct parameters."""
        # Use our helper to create a proper mock
        mock_websocket.return_value = create_websocket_mock()
        
        client = ClarityClient()
        
        # Verify initialization
        assert client.connected is False
        assert client.callbacks == {}
        
        # Verify WebSocketClient was created with correct URL
        mock_websocket.assert_called_once_with(
            url="ws://test-clarity.com:3001/test-ws?format=edn&language=python",
            format="edn",
            auto_reconnect=True,
            reconnect_delay=5
        )

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    def test_clarity_client_default_environment(self, mock_websocket):
        """Test ClarityClient uses default environment values."""
        # Use our helper to create a proper mock
        mock_websocket.return_value = create_websocket_mock()
        
        client = ClarityClient()
        
        # Should use defaults when env vars not set
        mock_websocket.assert_called_once_with(
            url="ws://localhost:2176/ws?format=edn&language=python",
            format="edn",
            auto_reconnect=True,
            reconnect_delay=5
        )

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    def test_clarity_client_message_handlers_setup(self, mock_websocket):
        """Test message handlers are properly configured."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        
        # Verify message handlers were set up
        assert mock_client_instance.on_message.call_count >= 3
        
        # Check handler registration calls for specific message types
        calls = mock_client_instance.on_message.call_args_list
        message_types = [call[0][0] for call in calls]
        
        assert "clarity.processing/result" in message_types
        assert "clarity.chat/history" in message_types
        assert "clarity.answer/final" in message_types


@pytest.mark.asyncio
@pytest.mark.unit
class TestClarityClientConnection:
    """Test ClarityClient connection management."""

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_successful_connection(self, mock_websocket):
        """Test successful connection to Clarity service."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_client_instance.connect.return_value = True
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        result = await client.connect()
        
        assert result is True
        assert client.connected is True
        mock_client_instance.connect.assert_called_once()

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_connection_failure(self, mock_websocket):
        """Test connection failure to Clarity service."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_client_instance.connect.return_value = False
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        result = await client.connect()
        
        assert result is False
        assert client.connected is False

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_disconnect(self, mock_websocket):
        """Test disconnection from Clarity service."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        await client.disconnect()
        
        assert client.connected is False
        mock_client_instance.disconnect.assert_called_once()

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_disconnect_when_not_connected(self, mock_websocket):
        """Test disconnect when not connected."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = False
        
        await client.disconnect()
        
        # Should not call disconnect if not connected
        mock_client_instance.disconnect.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.unit
class TestClarityClientMessageHandling:
    """Test ClarityClient message handling and callbacks."""

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_processing_result_with_callback(self, mock_websocket):
        """Test processing result handler with callback."""
        mock_client_instance = AsyncMock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        
        # Set up a callback
        callback_mock = MagicMock()
        request_id = "test-req-123"
        client.callbacks[request_id] = callback_mock
        
        # Test payload with request_id
        payload = {"request_id": request_id, "result": "success"}
        result = await client.on_processing_result("msg-123", payload)
        
        # Callback should be called and removed
        callback_mock.assert_called_once_with(payload)
        assert request_id not in client.callbacks
        assert result == payload

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_processing_result_with_keyword_style_key(self, mock_websocket):
        """Test processing result handler with keyword-style key."""
        mock_client_instance = AsyncMock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        
        callback_mock = MagicMock()
        request_id = "test-req-456"
        client.callbacks[request_id] = callback_mock
        
        # Test payload with :request_id (keyword style)
        payload = {":request_id": request_id, "result": "success"}
        result = await client.on_processing_result("msg-456", payload)
        
        callback_mock.assert_called_once_with(payload)
        assert request_id not in client.callbacks

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_processing_result_with_hyphenated_key(self, mock_websocket):
        """Test processing result handler with hyphenated key."""
        mock_client_instance = AsyncMock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        
        callback_mock = MagicMock()
        request_id = "test-req-789"
        client.callbacks[request_id] = callback_mock
        
        # Test payload with request-id (hyphenated)
        payload = {"request-id": request_id, "result": "success"}
        result = await client.on_processing_result("msg-789", payload)
        
        callback_mock.assert_called_once_with(payload)
        assert request_id not in client.callbacks

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_processing_result_without_callback(self, mock_websocket):
        """Test processing result handler without callback."""
        mock_client_instance = AsyncMock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        
        payload = {"request_id": "unknown-req", "result": "success"}
        result = await client.on_processing_result("msg-unknown", payload)
        
        assert result == payload
        # No callbacks should be modified
        assert client.callbacks == {}

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_chat_history_handler(self, mock_websocket):
        """Test chat history message handler."""
        mock_client_instance = AsyncMock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        
        payload = {"messages": [{"content": "Hello", "role": "user"}]}
        
        # Mock the nous_server import that happens inside the method
        with patch('src.relica_nous_langchain.services.clarity_client.nousServer') as mock_nous_server:
            result = await client.on_chat_history("msg-123", payload)
            
            mock_nous_server.sendChatHistory.assert_called_once_with(payload)
            assert result == payload

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_final_answer_handler(self, mock_websocket):
        """Test final answer message handler."""
        mock_client_instance = AsyncMock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        
        payload = {"answer": "The answer is 42", "confidence": 0.95}
        
        # Mock the nous_server import that happens inside the method
        with patch('src.relica_nous_langchain.services.clarity_client.nousServer') as mock_nous_server:
            result = await client.on_final_answer("msg-456", payload)
            
            mock_nous_server.sendFinalAnswer.assert_called_once_with(payload)
            assert result == payload


@pytest.mark.asyncio
@pytest.mark.unit
class TestClarityClientAPI:
    """Test ClarityClient API methods."""

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_process_user_input_success(self, mock_websocket):
        """Test successful user input processing."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.return_value = {"status": "processed", "id": "req-123"}
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        # Test with callback
        callback_mock = MagicMock()
        result = await client.process_user_input("Hello, world!", callback_mock)
        
        # Verify send was called with proper format
        mock_client_instance.send.assert_called_once()
        send_args = mock_client_instance.send.call_args
        assert send_args[0][0] == "clarity.input/process"
        assert "request-id" in send_args[0][1]
        assert send_args[0][1]["input"] == "Hello, world!"
        
        # Verify callback was registered
        request_id = send_args[0][1]["request-id"]
        assert request_id in client.callbacks
        assert client.callbacks[request_id] == callback_mock

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_process_user_input_without_callback(self, mock_websocket):
        """Test user input processing without callback."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.return_value = {"status": "processed"}
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        result = await client.process_user_input("Test input")
        
        # Verify send was called
        mock_client_instance.send.assert_called_once()
        # No callback should be registered
        assert len(client.callbacks) == 0

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_process_user_input_auto_connect(self, mock_websocket):
        """Test auto-connection when processing user input."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.return_value = {"status": "processed"}
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = False
        
        # Mock connect method
        client.connect = AsyncMock(return_value=True)
        
        result = await client.process_user_input("Test input")
        
        # Should auto-connect
        client.connect.assert_called_once()

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_process_user_input_connection_failure(self, mock_websocket):
        """Test user input processing when connection fails."""
        mock_client_instance = AsyncMock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = False
        
        # Mock connect method to fail
        client.connect = AsyncMock(return_value=False)
        
        result = await client.process_user_input("Test input")
        
        assert "error" in result
        assert result["error"] == "Failed to connect to Clarity"

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_process_user_input_send_exception(self, mock_websocket):
        """Test user input processing with send exception."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.side_effect = Exception("Network error")
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        result = await client.process_user_input("Test input")
        
        assert "error" in result
        assert "Network error" in result["error"]

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_specialize_kind_success(self, mock_websocket):
        """Test successful kind specialization."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.return_value = {"uid": "new-kind-123", "created": True}
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        result = await client.specializeKind("base-123", "Animal", "Dog")
        
        mock_client_instance.send.assert_called_once_with(
            "clarity.kind/specialize",
            {
                "uid": "base-123",
                "supertype_name": "Animal", 
                "name": "Dog"
            }
        )
        assert result["created"] is True

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_specialize_kind_auto_connect(self, mock_websocket):
        """Test kind specialization with auto-connection."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.return_value = {"success": True}
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = False
        client.connect = AsyncMock(return_value=True)
        
        result = await client.specializeKind("base-123", "Animal", "Cat")
        
        client.connect.assert_called_once()

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_classify_individual_success(self, mock_websocket):
        """Test successful individual classification."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.return_value = {"uid": "ind-456", "classified": True}
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        result = await client.classifyIndividual("ind-456", "Person", "John Doe")
        
        mock_client_instance.send.assert_called_once_with(
            "clarity.individual/classify",
            {
                "uid": "ind-456",
                "kind_name": "Person",
                "name": "John Doe"
            }
        )
        assert result["classified"] is True

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_classify_individual_connection_error(self, mock_websocket):
        """Test individual classification with connection error."""
        mock_client_instance = AsyncMock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = False
        client.connect = AsyncMock(return_value=False)
        
        result = await client.classifyIndividual("ind-456", "Person", "John Doe")
        
        assert "error" in result
        assert result["error"] == "Failed to connect to Clarity"

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_retrieve_models_success(self, mock_websocket):
        """Test successful model retrieval."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.return_value = {
            "models": [
                {"uid": "model-1", "name": "Test Model 1"},
                {"uid": "model-2", "name": "Test Model 2"}
            ]
        }
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        result = await client.retrieveModels(["model-1", "model-2"])
        
        mock_client_instance.send.assert_called_once_with(
            "clarity.model/get-batch",
            {"uids": ["model-1", "model-2"]}
        )
        assert len(result["models"]) == 2

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_retrieve_models_exception(self, mock_websocket):
        """Test model retrieval with exception."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.side_effect = Exception("Database error")
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        result = await client.retrieveModels(["model-1"])
        
        assert "error" in result
        assert "Database error" in result["error"]


@pytest.mark.asyncio
@pytest.mark.unit
class TestClarityClientProxy:
    """Test ClarityClientProxy functionality and context injection."""

    def test_proxy_initialization(self):
        """Test ClarityClientProxy initialization."""
        proxy = ClarityClientProxy("user-123", "env-456")
        
        assert proxy.user_id == "user-123"
        assert proxy.env_id == "env-456"
        assert proxy._target_client == clarity_client

    async def test_proxy_connection_forwarding(self):
        """Test that proxy forwards connection methods directly."""
        proxy = ClarityClientProxy("user-123", "env-456")
        
        with patch.object(proxy._target_client, 'connect', new_callable=AsyncMock) as mock_connect:
            mock_connect.return_value = True
            
            result = await proxy.connect()
            
            assert result is True
            mock_connect.assert_called_once()

    async def test_proxy_disconnect_forwarding(self):
        """Test that proxy forwards disconnect methods directly."""
        proxy = ClarityClientProxy("user-123", "env-456")
        
        with patch.object(proxy._target_client, 'disconnect', new_callable=AsyncMock) as mock_disconnect:
            result = await proxy.disconnect()
            
            mock_disconnect.assert_called_once()

    async def test_proxy_process_user_input_forwarding(self):
        """Test that proxy forwards process_user_input directly."""
        proxy = ClarityClientProxy("user-123", "env-456")
        
        with patch.object(proxy._target_client, 'process_user_input', new_callable=AsyncMock) as mock_method:
            mock_method.return_value = {"status": "processed"}
            
            result = await proxy.process_user_input("Hello")
            
            mock_method.assert_called_once_with("Hello")
            assert result == {"status": "processed"}

    async def test_proxy_specialize_kind_with_context(self):
        """Test that proxy forwards specializeKind with context injection."""
        proxy = ClarityClientProxy("user-123", "env-456")
        
        with patch.object(proxy._target_client, 'specializeKind', new_callable=AsyncMock) as mock_method:
            mock_method.return_value = {"success": True}
            
            result = await proxy.specializeKind("base-123", "Animal", "Dog")
            
            # Should include user_id and env_id as first arguments
            mock_method.assert_called_once_with("user-123", "env-456", "base-123", "Animal", "Dog")
            assert result == {"success": True}

    async def test_proxy_classify_individual_with_context(self):
        """Test that proxy forwards classifyIndividual with context injection."""
        proxy = ClarityClientProxy("user-123", "env-456")
        
        with patch.object(proxy._target_client, 'classifyIndividual', new_callable=AsyncMock) as mock_method:
            mock_method.return_value = {"classified": True}
            
            result = await proxy.classifyIndividual("ind-456", "Person", "John")
            
            mock_method.assert_called_once_with("user-123", "env-456", "ind-456", "Person", "John")
            assert result == {"classified": True}

    async def test_proxy_retrieve_models_with_context(self):
        """Test that proxy forwards retrieveModels with context injection."""
        proxy = ClarityClientProxy("user-123", "env-456")
        
        with patch.object(proxy._target_client, 'retrieveModels', new_callable=AsyncMock) as mock_method:
            mock_method.return_value = {"models": []}
            
            result = await proxy.retrieveModels(["model-1", "model-2"])
            
            mock_method.assert_called_once_with("user-123", "env-456", ["model-1", "model-2"])
            assert result == {"models": []}

    async def test_proxy_call_method(self):
        """Test the internal _proxy_call method."""
        proxy = ClarityClientProxy("user-123", "env-456")
        
        with patch.object(proxy._target_client, 'specializeKind', new_callable=AsyncMock) as mock_method:
            mock_method.return_value = {"result": "success"}
            
            result = await proxy._proxy_call('specializeKind', "base-123", "Animal", "Cat")
            
            mock_method.assert_called_once_with("user-123", "env-456", "base-123", "Animal", "Cat")
            assert result == {"result": "success"}


@pytest.mark.asyncio
@pytest.mark.unit
class TestClarityClientIntegration:
    """Test ClarityClient integration scenarios and workflows."""

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_complete_processing_workflow(self, mock_websocket):
        """Test complete user input processing workflow with callback."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.return_value = {"status": "processing", "request_id": "req-123"}
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        # Set up callback
        result_data = {"final_result": "processed successfully"}
        callback_results = []
        
        def test_callback(payload):
            callback_results.append(payload)
        
        # Process input
        await client.process_user_input("Analyze this text", test_callback)
        
        # Simulate receiving processing result
        await client.on_processing_result("msg-123", {
            "request_id": "req-123",
            "result": result_data
        })
        
        # Verify callback was called
        assert len(callback_results) == 1
        assert callback_results[0]["result"] == result_data

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_semantic_model_creation_workflow(self, mock_websocket):
        """Test semantic model creation workflow."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.side_effect = [
            {"uid": "kind-dog", "created": True},      # specializeKind
            {"uid": "ind-buddy", "classified": True}   # classifyIndividual
        ]
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        # Create specialized kind
        kind_result = await client.specializeKind("animal-123", "Animal", "Dog")
        assert kind_result["created"] is True
        
        # Classify individual
        individual_result = await client.classifyIndividual("buddy-456", "Dog", "Buddy")
        assert individual_result["classified"] is True

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_batch_model_retrieval_workflow(self, mock_websocket):
        """Test batch model retrieval workflow."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.return_value = {
            "models": [
                {"uid": "model-1", "name": "Dog Model", "confidence": 0.95},
                {"uid": "model-2", "name": "Cat Model", "confidence": 0.88}
            ],
            "total": 2
        }
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        result = await client.retrieveModels(["model-1", "model-2"])
        
        assert len(result["models"]) == 2
        assert result["total"] == 2
        assert all("confidence" in model for model in result["models"])

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_error_recovery_workflow(self, mock_websocket):
        """Test error recovery in processing workflow."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.side_effect = [
            Exception("Network timeout"),  # First attempt fails
            {"status": "processed"}        # Retry succeeds
        ]
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        # First attempt should return error
        result1 = await client.process_user_input("Test input")
        assert "error" in result1
        
        # Second attempt should succeed
        result2 = await client.process_user_input("Test input")
        assert result2["status"] == "processed"


@pytest.mark.asyncio
@pytest.mark.unit
class TestClarityClientErrorHandling:
    """Test ClarityClient error handling and edge cases."""

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_multiple_callback_registrations(self, mock_websocket):
        """Test handling of multiple callback registrations."""
        mock_client_instance = AsyncMock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        
        # Register multiple callbacks
        callback1 = MagicMock()
        callback2 = MagicMock()
        
        client.callbacks["req-1"] = callback1
        client.callbacks["req-2"] = callback2
        
        # Process result for one request
        await client.on_processing_result("msg-1", {"request_id": "req-1", "result": "success"})
        
        # Only callback1 should be called and removed
        callback1.assert_called_once()
        callback2.assert_not_called()
        assert "req-1" not in client.callbacks
        assert "req-2" in client.callbacks

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_malformed_message_handling(self, mock_websocket):
        """Test handling of malformed messages."""
        mock_client_instance = AsyncMock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        
        # Test with completely malformed payload
        result = await client.on_processing_result("msg-1", {})
        assert result == {}
        
        # Test with partial payload
        result = await client.on_processing_result("msg-2", {"result": "success"})
        assert result["result"] == "success"

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_concurrent_processing_requests(self, mock_websocket):
        """Test handling of concurrent processing requests."""
        mock_client_instance = AsyncMock()
        mock_client_instance.send.return_value = {"status": "processing"}
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        client.connected = True
        
        # Submit multiple concurrent requests
        tasks = [
            client.process_user_input(f"Input {i}")
            for i in range(5)
        ]
        
        results = await asyncio.gather(*tasks)
        
        # All should succeed
        assert len(results) == 5
        assert all(result["status"] == "processing" for result in results)
        assert mock_client_instance.send.call_count == 5

    @patch('src.relica_nous_langchain.services.clarity_client.WebSocketClient')
    async def test_connection_state_management(self, mock_websocket):
        """Test connection state management during operations."""
        mock_client_instance = AsyncMock()
        mock_websocket.return_value = mock_client_instance
        
        client = ClarityClient()
        
        # Test auto-connect behavior
        client.connected = False
        client.connect = AsyncMock(return_value=True)
        
        await client.specializeKind("base-123", "Animal", "Dog")
        
        # Should attempt to connect
        client.connect.assert_called_once() 