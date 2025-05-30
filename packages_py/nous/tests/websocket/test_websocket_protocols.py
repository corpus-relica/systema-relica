"""
WebSocket protocol and message format tests.

Tests comprehensive WebSocket communication protocols including:
- JSON and EDN message format support
- Message serialization/deserialization
- Protocol compliance and validation
- Error handling and recovery
- Format conversion between JSON and EDN
"""

import asyncio
import json
import pytest
from unittest.mock import AsyncMock, patch

from src.meridian.message_format import (
    serialize_message, 
    deserialize_message, 
    FORMAT_JSON, 
    FORMAT_EDN,
    dict_to_edn_str
)
from src.meridian.server import WebSocketServer
from tests.utils.websocket_utils import (
    MockWebSocketServer,
    WebSocketTestClient,
    MessageValidator,
    generate_test_user_message,
    generate_test_final_answer
)


@pytest.mark.websocket
@pytest.mark.asyncio
class TestWebSocketMessageFormats:
    """Test WebSocket message format support and conversions."""
    
    async def test_json_message_format_support(self):
        """Test complete JSON message format support."""
        server = MockWebSocketServer()
        
        # Register JSON message handler
        json_messages_received = []
        
        async def json_handler(message, websocket):
            json_messages_received.append(message)
            return {
                "type": "json-response",
                "received": message,
                "format": "json"
            }
        
        server.register_message_handler("json-test", json_handler)
        await server.start()
        
        try:
            client = WebSocketTestClient(server.url)
            await client.connect()
            
            # Send JSON message
            json_message = {
                "type": "json-test",
                "data": "Hello JSON!",
                "numbers": [1, 2, 3],
                "nested": {"key": "value"}
            }
            
            await client.send_message(json_message)
            response = await client.receive_json_message()
            
            assert response["type"] == "json-response"
            assert response["format"] == "json"
            assert response["received"]["data"] == "Hello JSON!"
            assert response["received"]["numbers"] == [1, 2, 3]
            assert response["received"]["nested"]["key"] == "value"
            
            await client.disconnect()
            
        finally:
            await server.stop()
    
    async def test_edn_message_format_support(self):
        """Test EDN message format support and conversion."""
        # Test EDN serialization
        message = {
            "type": "edn-test",
            "data": "Hello EDN!",
            "number": 42,
            "boolean": True,
            "null_value": None
        }
        
        edn_string = serialize_message(message, FORMAT_EDN)
        
        # Verify EDN format characteristics
        assert isinstance(edn_string, str)
        assert ":type" in edn_string
        assert ":data" in edn_string
        assert ":number" in edn_string
        assert ":boolean" in edn_string
        assert ":null_value" in edn_string
        assert "edn-test" in edn_string
        assert "Hello EDN!" in edn_string
        assert "42" in edn_string
        assert "true" in edn_string
        assert "nil" in edn_string
    
    async def test_message_format_conversion(self):
        """Test conversion between JSON and EDN formats."""
        original_message = {
            "type": "format-test",
            "user_id": "test_user_123",
            "data": {
                "items": ["item1", "item2"],
                "count": 2,
                "active": True
            }
        }
        
        # Serialize to both formats
        json_string = serialize_message(original_message, FORMAT_JSON)
        edn_string = serialize_message(original_message, FORMAT_EDN)
        
        # Both should be strings but different formats
        assert isinstance(json_string, str)
        assert isinstance(edn_string, str)
        assert json_string != edn_string
        
        # JSON should have quotes around keys
        assert '"type"' in json_string
        assert '"user_id"' in json_string
        
        # EDN should have colons before keys
        assert ':type' in edn_string
        assert ':user_id' in edn_string
        
        # Deserialize JSON back
        json_deserialized = deserialize_message(json_string, FORMAT_JSON)
        assert json_deserialized == original_message
    
    async def test_client_format_preferences(self):
        """Test that clients can specify their preferred message format."""
        server = WebSocketServer()
        
        # Mock WebSocket connections for different format preferences
        json_websocket = AsyncMock()
        edn_websocket = AsyncMock()
        
        # Add clients with different format preferences
        await server.add_client("json_client", json_websocket, FORMAT_JSON, "python")
        await server.add_client("edn_client", edn_websocket, FORMAT_EDN, "clojure")
        
        # Send same message to both clients
        test_message = {
            "type": "format-preference-test",
            "data": "Hello clients!"
        }
        
        await server.send("json_client", test_message)
        await server.send("edn_client", test_message)
        
        # Verify JSON client received JSON format
        json_call_args = json_websocket.send_text.call_args[0][0]
        json_parsed = json.loads(json_call_args)
        assert json_parsed["type"] == "format-preference-test"
        assert json_parsed["data"] == "Hello clients!"
        
        # Verify EDN client received EDN format
        edn_call_args = edn_websocket.send_text.call_args[0][0]
        assert isinstance(edn_call_args, str)
        assert ":type" in edn_call_args
        assert ":data" in edn_call_args
        assert "format-preference-test" in edn_call_args


@pytest.mark.websocket
@pytest.mark.asyncio
class TestWebSocketProtocolCompliance:
    """Test WebSocket protocol compliance and standards."""
    
    async def test_user_input_protocol_compliance(self):
        """Test user input message protocol compliance."""
        server = MockWebSocketServer()
        
        # Track protocol compliance
        compliant_messages = []
        non_compliant_messages = []
        
        async def protocol_validator(message, websocket):
            if MessageValidator.validate_user_input_message(message):
                compliant_messages.append(message)
                return generate_test_final_answer(
                    client_id=message["client_id"],
                    answer="Message is protocol compliant"
                )
            else:
                non_compliant_messages.append(message)
                return {
                    "type": "error",
                    "client_id": message.get("client_id", "unknown"),
                    "error": "Message does not comply with user-input protocol"
                }
        
        server.register_message_handler("user-input", protocol_validator)
        await server.start()
        
        try:
            client = WebSocketTestClient(server.url)
            await client.connect()
            
            # Test compliant message
            compliant_message = generate_test_user_message(
                user_id="test_user",
                env_id="test_env",
                message="This message follows the protocol"
            )
            
            await client.send_message(compliant_message)
            response = await client.receive_json_message()
            
            assert response["type"] == "final-answer"
            assert "protocol compliant" in response["answer"]
            assert len(compliant_messages) == 1
            assert len(non_compliant_messages) == 0
            
            # Test non-compliant message
            non_compliant_message = {
                "type": "user-input",
                "user_id": "test_user"
                # Missing required fields: env_id, client_id, message
            }
            
            await client.send_message(non_compliant_message)
            error_response = await client.receive_json_message()
            
            assert error_response["type"] == "error"
            assert "does not comply" in error_response["error"]
            assert len(compliant_messages) == 1
            assert len(non_compliant_messages) == 1
            
            await client.disconnect()
            
        finally:
            await server.stop()
    
    async def test_heartbeat_protocol(self):
        """Test heartbeat protocol implementation."""
        server = WebSocketServer()
        
        # Mock client to receive heartbeats
        mock_websocket = AsyncMock()
        await server.add_client("heartbeat_client", mock_websocket, "json", "python")
        
        # Send heartbeat message
        heartbeat = {
            "id": "server",
            "type": "heartbeat",
            "payload": {
                "server_time": 1234567890,
                "active_clients": 1
            }
        }
        
        await server.broadcast(heartbeat)
        
        # Verify heartbeat was sent
        mock_websocket.send_text.assert_called_once()
        sent_data = mock_websocket.send_text.call_args[0][0]
        sent_message = json.loads(sent_data)
        
        # Verify heartbeat protocol compliance
        assert sent_message["id"] == "server"
        assert sent_message["type"] == "heartbeat"
        assert "payload" in sent_message
        assert "server_time" in sent_message["payload"]
        assert "active_clients" in sent_message["payload"]
        assert isinstance(sent_message["payload"]["server_time"], int)
        assert isinstance(sent_message["payload"]["active_clients"], int)
    
    async def test_ping_pong_protocol(self):
        """Test ping-pong keepalive protocol."""
        server = WebSocketServer()
        
        # Register ping handler (should be registered by default)
        from src.meridian.server import handle_ping
        server.register_handler("ping", handle_ping)
        
        # Test ping-pong exchange
        ping_message = {"type": "ping", "timestamp": 1234567890}
        response = await server.handlers["ping"](ping_message, "test_client")
        
        # Verify pong response protocol
        assert "pong" in response
        assert response["pong"] is True
        assert "server_time" in response
        assert isinstance(response["server_time"], int)
    
    async def test_error_message_protocol(self):
        """Test error message protocol compliance."""
        error_message = {
            "type": "error",
            "client_id": "test_client_123",
            "error": "Test error message",
            "timestamp": "2025-05-29T18:00:00Z"
        }
        
        # Validate error message structure
        assert MessageValidator.validate_error_message(error_message)
        
        # Test with missing fields
        invalid_error = {"type": "error", "client_id": "test"}
        assert not MessageValidator.validate_error_message(invalid_error)


@pytest.mark.websocket
@pytest.mark.asyncio
class TestWebSocketMessageContracts:
    """Test WebSocket message contracts and schemas."""
    
    async def test_nous_user_interaction_contract(self):
        """Test complete NOUS user interaction message contract."""
        server = MockWebSocketServer()
        
        # Track complete interaction flow
        interaction_steps = []
        
        async def nous_interaction_handler(message, websocket):
            interaction_steps.append(f"received_{message['type']}")
            
            if message["type"] == "user-input":
                # Simulate NOUS processing
                interaction_steps.append("processing_with_nous")
                
                # Return final answer
                return {
                    "type": "final-answer",
                    "client_id": message["client_id"],
                    "answer": f"NOUS processed: {message['message']}",
                    "timestamp": "2025-05-29T18:00:00Z"
                }
        
        server.register_message_handler("user-input", nous_interaction_handler)
        await server.start()
        
        try:
            client = WebSocketTestClient(server.url)
            await client.connect()
            
            # Send user input following contract
            user_input = {
                "type": "user-input",
                "user_id": "contract_test_user",
                "env_id": "contract_test_env",
                "client_id": "contract_test_client",
                "message": "Test the interaction contract",
                "timestamp": "2025-05-29T18:00:00Z"
            }
            
            await client.send_message(user_input)
            response = await client.receive_json_message()
            
            # Verify response contract compliance
            assert response["type"] == "final-answer"
            assert response["client_id"] == "contract_test_client"
            assert "NOUS processed" in response["answer"]
            assert "timestamp" in response
            
            # Verify interaction flow
            assert "received_user-input" in interaction_steps
            assert "processing_with_nous" in interaction_steps
            
            await client.disconnect()
            
        finally:
            await server.stop()
    
    async def test_multi_client_broadcast_contract(self):
        """Test multi-client broadcast message contract."""
        server = MockWebSocketServer()
        
        async def broadcast_handler(message, websocket):
            if message["type"] == "request-broadcast":
                # Simulate broadcast to all clients
                broadcast_message = {
                    "type": "broadcast",
                    "from": message["client_id"],
                    "message": message["message"],
                    "timestamp": "2025-05-29T18:00:00Z"
                }
                
                # In real implementation, this would broadcast to all clients
                return {
                    "type": "broadcast-confirmation",
                    "client_id": message["client_id"],
                    "recipients": 3,  # Simulated recipient count
                    "broadcast_id": "broadcast_123"
                }
        
        server.register_message_handler("request-broadcast", broadcast_handler)
        await server.start()
        
        try:
            client = WebSocketTestClient(server.url)
            await client.connect()
            
            # Request broadcast
            broadcast_request = {
                "type": "request-broadcast",
                "client_id": "broadcast_client",
                "message": "Hello everyone!",
                "timestamp": "2025-05-29T18:00:00Z"
            }
            
            await client.send_message(broadcast_request)
            confirmation = await client.receive_json_message()
            
            # Verify broadcast confirmation contract
            assert confirmation["type"] == "broadcast-confirmation"
            assert confirmation["client_id"] == "broadcast_client"
            assert confirmation["recipients"] == 3
            assert "broadcast_id" in confirmation
            
            await client.disconnect()
            
        finally:
            await server.stop()


@pytest.mark.websocket
@pytest.mark.asyncio
class TestWebSocketErrorHandling:
    """Test WebSocket error handling and recovery."""
    
    async def test_malformed_json_handling(self):
        """Test handling of malformed JSON messages."""
        # Test with various malformed JSON
        malformed_json_messages = [
            '{"type": "test", "data":}',  # Trailing comma
            '{"type": "test" "missing_comma": true}',  # Missing comma
            '{"type": "test", "data": undefined}',  # JavaScript undefined
            '{type: "test"}',  # Unquoted keys
            '{"type": "test", "data": "unclosed string}',  # Unclosed string
        ]
        
        for malformed_json in malformed_json_messages:
            result = deserialize_message(malformed_json, FORMAT_JSON)
            # Should gracefully handle malformed JSON
            assert result is None
    
    async def test_websocket_connection_errors(self):
        """Test WebSocket connection error handling."""
        server = WebSocketServer()
        
        # Mock WebSocket that raises errors
        error_websocket = AsyncMock()
        error_websocket.send_text.side_effect = Exception("Connection error")
        
        await server.add_client("error_client", error_websocket, "json", "python")
        
        # Try to send message to error client
        test_message = {"type": "test", "data": "error test"}
        success = await server.send("error_client", test_message)
        
        # Should return False on error
        assert success is False
        
        # Server should still be functional for other clients
        good_websocket = AsyncMock()
        await server.add_client("good_client", good_websocket, "json", "python")
        
        success = await server.send("good_client", test_message)
        assert success is True
        good_websocket.send_text.assert_called_once()
    
    async def test_message_validation_errors(self):
        """Test message validation error handling."""
        server = MockWebSocketServer()
        
        validation_errors = []
        
        async def validating_handler(message, websocket):
            try:
                # Strict validation
                required_fields = ["type", "client_id", "data"]
                for field in required_fields:
                    if field not in message:
                        raise ValueError(f"Missing required field: {field}")
                
                return {"status": "valid", "message": "Message validated successfully"}
                
            except Exception as e:
                validation_errors.append(str(e))
                return {
                    "type": "validation-error",
                    "error": str(e),
                    "received_message": message
                }
        
        server.register_message_handler("strict-validation", validating_handler)
        await server.start()
        
        try:
            client = WebSocketTestClient(server.url)
            await client.connect()
            
            # Send invalid message
            invalid_message = {
                "type": "strict-validation",
                "client_id": "test_client"
                # Missing 'data' field
            }
            
            await client.send_message(invalid_message)
            response = await client.receive_json_message()
            
            assert response["type"] == "validation-error"
            assert "Missing required field: data" in response["error"]
            assert len(validation_errors) == 1
            
            await client.disconnect()
            
        finally:
            await server.stop()


@pytest.mark.websocket
@pytest.mark.asyncio  
@pytest.mark.network
class TestWebSocketPerformance:
    """Test WebSocket performance and scalability."""
    
    async def test_high_frequency_messaging(self):
        """Test high-frequency message processing."""
        server = MockWebSocketServer()
        
        message_count = 0
        processing_times = []
        
        async def high_frequency_handler(message, websocket):
            nonlocal message_count
            message_count += 1
            
            # Simulate processing time
            import time
            start_time = time.time()
            await asyncio.sleep(0.001)  # 1ms processing
            end_time = time.time()
            
            processing_times.append(end_time - start_time)
            
            return {
                "type": "processed",
                "message_id": message.get("id"),
                "processing_time": end_time - start_time
            }
        
        server.register_message_handler("high-frequency", high_frequency_handler)
        await server.start()
        
        try:
            client = WebSocketTestClient(server.url)
            await client.connect()
            
            # Send multiple messages rapidly
            num_messages = 50
            tasks = []
            
            for i in range(num_messages):
                message = {
                    "type": "high-frequency",
                    "id": f"msg_{i}",
                    "data": f"Message {i}"
                }
                
                task = asyncio.create_task(client.send_and_receive(message))
                tasks.append(task)
            
            # Wait for all messages to be processed
            responses = await asyncio.gather(*tasks)
            
            assert len(responses) == num_messages
            assert message_count == num_messages
            
            # Verify all responses
            for i, response_str in enumerate(responses):
                response = json.loads(response_str)
                assert response["type"] == "processed"
                assert response["message_id"] == f"msg_{i}"
                assert "processing_time" in response
            
            # Check processing times
            avg_processing_time = sum(processing_times) / len(processing_times)
            assert avg_processing_time < 0.01  # Should process quickly
            
            await client.disconnect()
            
        finally:
            await server.stop()
    
    async def test_large_message_handling(self):
        """Test handling of large WebSocket messages."""
        server = MockWebSocketServer()
        
        large_messages_processed = []
        
        async def large_message_handler(message, websocket):
            large_messages_processed.append(len(str(message)))
            return {
                "type": "large-message-processed",
                "original_size": len(str(message)),
                "data_length": len(message.get("large_data", ""))
            }
        
        server.register_message_handler("large-message", large_message_handler)
        await server.start()
        
        try:
            client = WebSocketTestClient(server.url)
            await client.connect()
            
            # Create large message (1MB of data)
            large_data = "x" * (1024 * 1024)  # 1MB string
            large_message = {
                "type": "large-message",
                "client_id": "test_client",
                "large_data": large_data
            }
            
            await client.send_message(large_message)
            response = await client.receive_json_message()
            
            assert response["type"] == "large-message-processed"
            assert response["data_length"] == 1024 * 1024
            assert len(large_messages_processed) == 1
            
            await client.disconnect()
            
        finally:
            await server.stop() 