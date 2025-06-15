"""Unit tests for NOUSServer."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import asyncio
import logging

from src.relica_nous_langchain.services.NOUSServer import NOUSServer


class TestNOUSServerInitialization:
    """Test NOUSServer initialization."""
    
    def test_nous_server_initialization(self):
        """Test NOUSServer initializes correctly."""
        server = NOUSServer()
        
        assert server.handle_user_input_func is None
        assert hasattr(server, 'init')
        assert hasattr(server, 'start_server')
        assert hasattr(server, 'handle_user_input')
        assert hasattr(server, 'heartbeat')
        assert hasattr(server, 'send_chat_history')
        assert hasattr(server, 'send_final_answer')
    
    def test_nous_server_init_method(self):
        """Test NOUSServer init method sets handler."""
        server = NOUSServer()
        mock_handler = MagicMock()
        
        result = server.init(mock_handler)
        
        assert server.handle_user_input_func == mock_handler
        assert result == server  # Should return self


class TestNOUSServerHandlers:
    """Test NOUSServer message handlers."""
    
    @pytest.fixture
    def server(self):
        """Create a NOUSServer instance with mock handler."""
        server = NOUSServer()
        server.handle_user_input_func = AsyncMock()
        return server
    
    @pytest.mark.asyncio
    async def test_handle_user_input_success(self, server):
        """Test handling user input with valid payload."""
        payload = {
            'user-id': 'test-user',
            'env-id': 'test-env',
            'message': 'Test message'
        }
        client_id = 'test-client-123'
        
        await server.handle_user_input(payload, client_id)
        
        # Verify the handler was called with correct parameters
        server.handle_user_input_func.assert_called_once_with(
            'test-user', 'test-env', 'Test message', 'test-client-123'
        )
    
    @pytest.mark.asyncio
    async def test_handle_user_input_no_handler(self):
        """Test handling user input when no handler is set."""
        server = NOUSServer()
        server.handle_user_input_func = None
        
        payload = {
            'user-id': 'test-user',
            'env-id': 'test-env',
            'message': 'Test message'
        }
        
        # Should not raise error even without handler
        await server.handle_user_input(payload, 'test-client')
    
    @pytest.mark.asyncio
    async def test_handle_user_input_exception(self, server):
        """Test handling user input when handler raises exception."""
        server.handle_user_input_func.side_effect = Exception("Handler error")
        
        # Mock send_error_message
        server.send_error_message = AsyncMock()
        
        payload = {
            'user-id': 'test-user',
            'env-id': 'test-env',
            'message': 'Test message'
        }
        client_id = 'test-client-123'
        
        await server.handle_user_input(payload, client_id)
        
        # Should send error message to client
        server.send_error_message.assert_called_once_with(
            'test-client-123',
            'Error processing your request: Handler error'
        )
    
    @pytest.mark.asyncio
    async def test_heartbeat(self, server):
        """Test heartbeat handler."""
        # Heartbeat should just pass without doing anything
        await server.heartbeat({'timestamp': 12345}, 'test-client')
        # No assertions needed - just ensure it doesn't raise


class TestNOUSServerMessaging:
    """Test NOUSServer messaging functions."""
    
    @pytest.fixture
    def server(self):
        """Create a NOUSServer instance."""
        return NOUSServer()
    
    @pytest.mark.asyncio
    async def test_send_chat_history(self, server):
        """Test sending chat history."""
        # Mock the ws_server
        with patch('src.relica_nous_langchain.services.NOUSServer.ws_server') as mock_ws:
            mock_ws.broadcast = AsyncMock(return_value=3)  # 3 clients
            
            chat_history = [
                {'role': 'user', 'content': 'Hello'},
                {'role': 'assistant', 'content': 'Hi there!'}
            ]
            
            await server.send_chat_history(chat_history)
            
            # Verify broadcast was called with correct message format
            expected_message = {
                "id": "nous-server",
                "type": "chatHistory",
                "payload": chat_history
            }
            mock_ws.broadcast.assert_called_once_with(expected_message)
    
    @pytest.mark.asyncio
    async def test_send_final_answer(self, server):
        """Test sending final answer."""
        # Mock the ws_server
        with patch('src.relica_nous_langchain.services.NOUSServer.ws_server') as mock_ws:
            mock_ws.broadcast = AsyncMock(return_value=2)  # 2 clients
            
            await server.send_final_answer('client-123', 'The answer is 42')
            
            # Verify broadcast was called with correct message format
            expected_message = {
                "id": "nous-server",
                "type": "nous.chat/final-answer",
                "payload": "The answer is 42"
            }
            mock_ws.broadcast.assert_called_once_with(expected_message)
    
    @pytest.mark.asyncio
    async def test_send_error_message(self, server):
        """Test sending error message."""
        # Mock the ws_server
        with patch('src.relica_nous_langchain.services.NOUSServer.ws_server') as mock_ws:
            mock_ws.broadcast = AsyncMock(return_value=1)  # 1 client
            
            await server.send_error_message('client-123', 'Something went wrong')
            
            # Verify broadcast was called with correct message format
            expected_message = {
                "id": "nous-server",
                "type": "error",
                "payload": {"error": "Something went wrong"}
            }
            mock_ws.broadcast.assert_called_once_with(expected_message)


class TestNOUSServerLifecycle:
    """Test NOUSServer lifecycle methods."""
    
    @pytest.fixture
    def server(self):
        """Create a NOUSServer instance."""
        return NOUSServer()
    
    @pytest.mark.asyncio
    async def test_start_server(self, server):
        """Test start_server creates a never-ending task."""
        # This method should run forever, so we'll test it with a timeout
        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(server.start_server(), timeout=0.1)


class TestNOUSServerIntegration:
    """Test NOUSServer integration scenarios."""
    
    @pytest.mark.asyncio
    async def test_full_message_flow(self):
        """Test complete message flow from user input to final answer."""
        server = NOUSServer()
        
        # Track calls to the handler
        handler_calls = []
        
        async def mock_handler(user_id, env_id, message, client_id):
            handler_calls.append({
                'user_id': user_id,
                'env_id': env_id,
                'message': message,
                'client_id': client_id
            })
        
        # Initialize server with handler
        server.init(mock_handler)
        
        # Mock ws_server for broadcasting
        with patch('src.relica_nous_langchain.services.NOUSServer.ws_server') as mock_ws:
            mock_ws.broadcast = AsyncMock(return_value=1)
            
            # Simulate user input
            payload = {
                'user-id': 'user-123',
                'env-id': 'env-456',
                'message': 'What is the meaning of life?'
            }
            await server.handle_user_input(payload, 'client-789')
            
            # Verify handler was called
            assert len(handler_calls) == 1
            assert handler_calls[0]['user_id'] == 'user-123'
            assert handler_calls[0]['env_id'] == 'env-456'
            assert handler_calls[0]['message'] == 'What is the meaning of life?'
            assert handler_calls[0]['client_id'] == 'client-789'
            
            # Simulate sending final answer
            await server.send_final_answer('client-789', 'The answer is 42')
            
            # Verify broadcast was called
            assert mock_ws.broadcast.call_count == 1
    
    @pytest.mark.asyncio
    async def test_error_handling_flow(self):
        """Test error handling flow."""
        server = NOUSServer()
        
        # Handler that raises an error
        async def failing_handler(user_id, env_id, message, client_id):
            raise ValueError("Invalid question")
        
        server.init(failing_handler)
        
        # Mock ws_server
        with patch('src.relica_nous_langchain.services.NOUSServer.ws_server') as mock_ws:
            mock_ws.broadcast = AsyncMock(return_value=1)
            
            # Simulate user input that will fail
            payload = {
                'user-id': 'user-123',
                'env-id': 'env-456',
                'message': 'Invalid question'
            }
            await server.handle_user_input(payload, 'client-789')
            
            # Verify error message was broadcast
            mock_ws.broadcast.assert_called_once()
            call_args = mock_ws.broadcast.call_args[0][0]
            assert call_args['type'] == 'error'
            assert 'Invalid question' in call_args['payload']['error']


class TestNOUSServerLogging:
    """Test NOUSServer logging behavior."""
    
    @pytest.mark.asyncio
    async def test_logging_suppression(self):
        """Test that EDN format logs are suppressed."""
        # Check that EDN logger is set to WARNING level
        edn_logger = logging.getLogger("edn_format")
        assert edn_logger.level == logging.WARNING
    
    @pytest.mark.asyncio
    async def test_server_logging(self, caplog):
        """Test server logging messages."""
        with caplog.at_level(logging.INFO):
            server = NOUSServer()
            # Should log initialization
            assert "Initialized NOUSServer" in caplog.text
            
            # Test init logging
            server.init(MagicMock())
            assert "Initializing NOUSServer" in caplog.text 