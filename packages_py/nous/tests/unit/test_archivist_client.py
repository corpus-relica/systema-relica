#!/usr/bin/env python3
"""
Comprehensive unit tests for ArchivistClient service.
Phase 3B: High-impact coverage for semantic knowledge base operations.

Coverage target: 365 lines (35% → 80% coverage improvement)
Test categories: Connection, CRUD operations, search, transactions, proxy patterns
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch, call
import os

# Import the classes to test
from src.relica_nous_langchain.services.archivist_client import (
    ArchivistClient, 
    ArchivistClientProxy,
    archivist_client
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
class TestArchivistClientInitialization:
    """Test ArchivistClient initialization and basic setup."""

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    @patch.dict('os.environ', {
        'ARCHIVIST_HOST': 'test-archivist.com',
        'ARCHIVIST_PORT': '3001',
        'ARCHIVIST_PATH': '/test-ws'
    })
    def test_archivist_client_initialization(self, mock_websocket):
        """Test ArchivistClient initializes with correct parameters."""
        # Use our helper to create a proper mock
        mock_websocket.return_value = create_websocket_mock()
        
        client = ArchivistClient()
        
        # Verify initialization
        assert client.connected is False
        assert client.heartbeat_task is None
        
        # Verify WebSocketClient was created with correct URL
        mock_websocket.assert_called_once_with(
            url="ws://test-archivist.com:3001/test-ws?format=edn&language=python",
            format="edn",
            auto_reconnect=True,
            reconnect_delay=5
        )

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    def test_archivist_client_default_environment(self, mock_websocket):
        """Test ArchivistClient uses default environment values."""
        # Use our helper to create a proper mock
        mock_websocket.return_value = create_websocket_mock()
        
        client = ArchivistClient()
        
        # Should use defaults when env vars not set
        mock_websocket.assert_called_once_with(
            url="ws://localhost:3000/ws?format=edn&language=python",
            format="edn",
            auto_reconnect=True,
            reconnect_delay=5
        )

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    def test_archivist_client_message_handlers_setup(self, mock_websocket):
        """Test message handlers are properly configured."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        
        # Verify message handlers were set up
        assert mock_client_instance.on_message.call_count >= 2
        
        # Check handler registration calls
        calls = mock_client_instance.on_message.call_args_list
        message_types = [call[0][0] for call in calls]
        
        assert "connect" in message_types
        assert "disconnect" in message_types


@pytest.mark.asyncio
@pytest.mark.unit
class TestArchivistClientConnection:
    """Test ArchivistClient connection management."""

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    @patch('asyncio.open_connection')
    async def test_successful_connection(self, mock_open_connection, mock_websocket):
        """Test successful connection to Archivist service."""
        # Mock socket connection
        mock_reader = AsyncMock()
        mock_writer = AsyncMock()
        mock_open_connection.return_value = (mock_reader, mock_writer)
        
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_client_instance.connect.return_value = True
        mock_client_instance.send.return_value = {"response": "pong"}
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        result = await client.connect()
        
        assert result is True
        assert client.connected is True
        mock_open_connection.assert_called_once_with("localhost", 3000)
        mock_client_instance.connect.assert_called_once()
        mock_client_instance.send.assert_called_once_with("ping", {"hello": "from-nous"})

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    @patch('asyncio.open_connection')
    async def test_connection_socket_failure(self, mock_open_connection, mock_websocket):
        """Test connection failure at socket level."""
        # Mock socket connection failure
        mock_open_connection.side_effect = Exception("Connection refused")
        
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        result = await client.connect()
        
        assert result is False
        assert client.connected is False
        # WebSocket connect should not be called if socket fails
        mock_client_instance.connect.assert_not_called()

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    @patch('asyncio.open_connection')
    async def test_connection_websocket_failure(self, mock_open_connection, mock_websocket):
        """Test connection failure at WebSocket level."""
        # Mock successful socket but WebSocket failure
        mock_reader = AsyncMock()
        mock_writer = AsyncMock()
        mock_open_connection.return_value = (mock_reader, mock_writer)
        
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_client_instance.connect.return_value = False
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        result = await client.connect()
        
        assert result is False
        assert client.connected is False

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    async def test_disconnect(self, mock_websocket):
        """Test disconnection from Archivist service."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        client.connected = True
        client.heartbeat_task = AsyncMock()
        
        await client.disconnect()
        
        assert client.connected is False
        mock_client_instance.disconnect.assert_called_once()


@pytest.mark.asyncio
@pytest.mark.unit
class TestArchivistClientHeartbeat:
    """Test ArchivistClient heartbeat functionality."""

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    def test_start_heartbeat_scheduler(self, mock_websocket):
        """Test heartbeat scheduler startup."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        
        with patch('asyncio.create_task') as mock_create_task:
            mock_task = AsyncMock()
            mock_create_task.return_value = mock_task
            
            client.start_heartbeat_scheduler(15000)
            
            mock_create_task.assert_called_once()
            assert client.heartbeat_task == mock_task

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    def test_stop_heartbeat_scheduler(self, mock_websocket):
        """Test heartbeat scheduler shutdown."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        
        # Mock an active heartbeat task
        mock_task = AsyncMock()
        mock_task.done.return_value = False
        client.heartbeat_task = mock_task
        
        client.stop_heartbeat_scheduler()
        
        mock_task.cancel.assert_called_once()

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    async def test_heartbeat_loop(self, mock_websocket):
        """Test heartbeat loop execution."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        client.connected = True
        
        # Mock send_heartbeat
        with patch.object(client, 'send_heartbeat', new_callable=AsyncMock) as mock_send_heartbeat:
            # Run loop once then stop
            async def run_once():
                await client._heartbeat_loop(100)  # 100ms interval
            
            # Cancel after first iteration
            with patch('asyncio.sleep', side_effect=[None, asyncio.CancelledError()]):
                with pytest.raises(asyncio.CancelledError):
                    await run_once()
                
                mock_send_heartbeat.assert_called()

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    async def test_send_heartbeat(self, mock_websocket):
        """Test sending heartbeat message."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        client.connected = True
        
        await client.send_heartbeat()
        
        mock_client_instance.send.assert_called_once()
        call_args = mock_client_instance.send.call_args
        assert call_args[0][0] == "archivist.system/heartbeat"
        assert "timestamp" in call_args[0][1]


@pytest.mark.asyncio
@pytest.mark.unit
class TestArchivistClientMessageHandling:
    """Test ArchivistClient message sending and response handling."""

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    async def test_send_message_success_response(self, mock_websocket):
        """Test successful message sending with new response format."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_client_instance.send.return_value = {
            "success": True,
            "data": {"result": "test-data"}
        }
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        client.connected = True
        
        result = await client._send_message("test.message", {"param": "value"})
        
        assert result == {"result": "test-data"}
        mock_client_instance.send.assert_called_once_with(
            "test.message", 
            {"param": "value"}, 
            5000
        )

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    async def test_send_message_error_response(self, mock_websocket):
        """Test message sending with error response."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_client_instance.send.return_value = {
            "success": False,
            "error": {
                "message": "Test error",
                "code": 404,
                "type": "not_found"
            }
        }
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        client.connected = True
        
        result = await client._send_message("test.error", {})
        
        assert "error" in result
        assert result["error"] == "Test error"
        assert result["code"] == 404

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    async def test_send_message_payload_format(self, mock_websocket):
        """Test message sending with direct payload format."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_client_instance.send.return_value = {"payload": {"data": "test"}}
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        client.connected = True
        
        result = await client._send_message("test.payload", {})
        
        assert result == {"data": "test"}

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    async def test_send_message_auto_connect(self, mock_websocket):
        """Test auto-connection when sending message."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_client_instance.send.return_value = {"success": True, "data": {}}
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        client.connected = False
        
        with patch.object(client, 'connect', new_callable=AsyncMock) as mock_connect:
            mock_connect.return_value = True
            client.connected = True  # Simulate successful connection
            
            result = await client._send_message("test.connect", {})
            
            mock_connect.assert_called_once()

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    async def test_send_message_connection_failure(self, mock_websocket):
        """Test message sending when connection fails."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        client.connected = False
        
        with patch.object(client, 'connect', new_callable=AsyncMock) as mock_connect:
            mock_connect.return_value = False
            
            result = await client._send_message("test.fail", {})
            
            assert "error" in result
            assert result["error"] == "Failed to connect to Archivist"


@pytest.mark.asyncio
@pytest.mark.unit
class TestArchivistClientQueryOperations:
    """Test ArchivistClient query and search operations."""

    async def test_execute_query(self):
        """Test graph query execution."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"results": [{"uid": "123"}]}
            
            client = ArchivistClient()
            result = await client.execute_query("MATCH (n) RETURN n", {"limit": 10})
            
            mock_send.assert_called_once_with(
                "archivist.graph/query-execute", 
                {"query": "MATCH (n) RETURN n", "params": {"limit": 10}}
            )
            assert result == {"results": [{"uid": "123"}]}

    async def test_resolve_uids(self):
        """Test UID resolution to full entities."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {
                "entities": [
                    {"uid": "123", "name": "John"},
                    {"uid": "456", "name": "Jane"}
                ]
            }
            
            client = ArchivistClient()
            result = await client.resolve_uids(["123", "456"])
            
            mock_send.assert_called_once_with(
                "archivist.entity/batch-resolve", 
                {"uids": ["123", "456"]}
            )
            assert len(result["entities"]) == 2

    async def test_get_kinds(self):
        """Test getting kinds with options."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"kinds": [{"uid": "1", "name": "Person"}]}
            
            client = ArchivistClient()
            result = await client.get_kinds({"sort": ["name", "ASC"], "range": [0, 10]})
            
            mock_send.assert_called_once_with(
                "archivist.kind/list", 
                {"sort": ["name", "ASC"], "range": [0, 10]}
            )

    async def test_get_collections(self):
        """Test getting entity collections."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"collections": ["individuals", "kinds", "facts"]}
            
            client = ArchivistClient()
            result = await client.get_collections()
            
            mock_send.assert_called_once_with("archivist.entity/collections-get", {})

    async def test_text_search(self):
        """Test text search functionality."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"matches": [{"uid": "123", "score": 0.95}]}
            
            client = ArchivistClient()
            result = await client.text_search({"query": "John Smith", "limit": 5})
            
            mock_send.assert_called_once_with(
                "archivist.search/text", 
                {"query": "John Smith", "limit": 5}
            ) 


@pytest.mark.asyncio
@pytest.mark.unit
class TestArchivistClientCRUDOperations:
    """Test ArchivistClient CRUD operations for aspects, concepts, definitions."""

    async def test_get_aspects(self):
        """Test getting aspects with filtering."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"aspects": [{"uid": "asp-1", "name": "Color"}]}
            
            client = ArchivistClient()
            result = await client.get_aspects({"filter": {"category": "visual"}})
            
            mock_send.assert_called_once_with(
                "archivist.aspect/list", 
                {"filter": {"category": "visual"}}
            )

    async def test_create_aspect(self):
        """Test creating a new aspect."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "asp-123", "created": True}
            
            client = ArchivistClient()
            aspect_data = {"name": "Temperature", "category": "physical"}
            result = await client.create_aspect(aspect_data)
            
            mock_send.assert_called_once_with("archivist.aspect/create", aspect_data)

    async def test_update_aspect(self):
        """Test updating an existing aspect."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "asp-123", "updated": True}
            
            client = ArchivistClient()
            result = await client.update_aspect("asp-123", {"name": "Heat"})
            
            mock_send.assert_called_once_with(
                "archivist.aspect/update", 
                {"name": "Heat", "uid": "asp-123"}
            )

    async def test_get_concept(self):
        """Test getting a concept by UID."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "con-123", "name": "Intelligence"}
            
            client = ArchivistClient()
            result = await client.get_concept("con-123")
            
            mock_send.assert_called_once_with(
                "archivist.concept/get", 
                {"uid": "con-123"}
            )

    async def test_create_concept(self):
        """Test creating a new concept."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "con-456", "created": True}
            
            client = ArchivistClient()
            concept_data = {"name": "Wisdom", "definition": "Applied knowledge"}
            result = await client.create_concept(concept_data)
            
            mock_send.assert_called_once_with("archivist.concept/create", concept_data)

    async def test_update_concept(self):
        """Test updating an existing concept."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "con-123", "updated": True}
            
            client = ArchivistClient()
            result = await client.update_concept("con-123", {"description": "Enhanced definition"})
            
            mock_send.assert_called_once_with(
                "archivist.concept/update", 
                {"description": "Enhanced definition", "uid": "con-123"}
            )

    async def test_get_definition(self):
        """Test getting a definition by UID."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "def-123", "text": "A definition of something"}
            
            client = ArchivistClient()
            result = await client.get_definition("def-123")
            
            mock_send.assert_called_once_with(
                "archivist.definition/get", 
                {"uid": "def-123"}
            )

    async def test_create_definition(self):
        """Test creating a new definition."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "def-456", "created": True}
            
            client = ArchivistClient()
            def_data = {"text": "The quality of being intelligent", "concept_uid": "con-123"}
            result = await client.create_definition(def_data)
            
            mock_send.assert_called_once_with("archivist.definition/create", def_data)


@pytest.mark.asyncio
@pytest.mark.unit
class TestArchivistClientFactOperations:
    """Test ArchivistClient fact management operations."""

    async def test_get_facts(self):
        """Test getting facts with filtering options."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"facts": [{"uid": "fact-1", "lh_object_uid": "123"}]}
            
            client = ArchivistClient()
            result = await client.get_facts({"entity_uid": "123", "limit": 50})
            
            mock_send.assert_called_once_with(
                "archivist.fact/list", 
                {"entity_uid": "123", "limit": 50}
            )

    async def test_get_all_related(self):
        """Test getting all facts related to an entity."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"facts": [{"uid": "fact-1"}, {"uid": "fact-2"}]}
            
            client = ArchivistClient()
            result = await client.get_all_related("entity-123")
            
            mock_send.assert_called_once_with(
                "archivist.fact/all-related-get", 
                {"uid": "entity-123"}
            )

    async def test_create_fact(self):
        """Test creating a new fact."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "fact-456", "created": True}
            
            client = ArchivistClient()
            fact_data = {
                "lh_object_uid": "person-123",
                "rel_type_uid": "has-age",
                "rh_object_uid": "25"
            }
            result = await client.create_fact(fact_data)
            
            mock_send.assert_called_once_with("archivist.fact/create", fact_data)

    async def test_update_fact(self):
        """Test updating an existing fact."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "fact-123", "updated": True}
            
            client = ArchivistClient()
            result = await client.update_fact("fact-123", {"rh_object_uid": "26"})
            
            mock_send.assert_called_once_with(
                "archivist.fact/update", 
                {"rh_object_uid": "26", "uid": "fact-123"}
            )

    async def test_delete_fact(self):
        """Test deleting a fact."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"deleted": True}
            
            client = ArchivistClient()
            result = await client.delete_fact("fact-123")
            
            mock_send.assert_called_once_with(
                "archivist.fact/delete", 
                {"uid": "fact-123"}
            )

    async def test_get_definitive_facts(self):
        """Test getting definitive facts about an entity."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"facts": [{"uid": "def-fact-1", "certainty": 1.0}]}
            
            client = ArchivistClient()
            result = await client.get_definitive_facts("entity-123")
            
            mock_send.assert_called_once_with(
                "archivist.fact/definitive-get", 
                {"uid": "entity-123"}
            )

    async def test_get_facts_relating_entities(self):
        """Test getting facts relating two entities."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"facts": [{"uid": "rel-fact-1"}]}
            
            client = ArchivistClient()
            result = await client.get_facts_relating_entities("entity-123", "entity-456")
            
            mock_send.assert_called_once_with(
                "archivist.fact/relating-entities-get", 
                {"uid1": "entity-123", "uid2": "entity-456"}
            )

    async def test_get_related_on_uid_subtype_cone(self):
        """Test getting related entities based on subtype cone."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"entities": [{"uid": "related-1"}]}
            
            client = ArchivistClient()
            result = await client.get_related_on_uid_subtype_cone("person-123", "has-profession")
            
            mock_send.assert_called_once_with(
                "archivist.fact/related-on-uid-subtype-cone-get", 
                {"lh-object-uid": "person-123", "rel-type-uid": "has-profession"}
            )

    async def test_get_inherited_relation(self):
        """Test getting inherited relations."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"relations": [{"uid": "inherited-1"}]}
            
            client = ArchivistClient()
            result = await client.get_inherited_relation("entity-123", "is-a")
            
            mock_send.assert_called_once_with(
                "archivist.fact/inherited-relation-get", 
                {"uid": "entity-123", "rel-type-uid": "is-a"}
            )

    async def test_get_classification_fact(self):
        """Test getting classification fact for an entity."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"classification": {"uid": "class-fact-1"}}
            
            client = ArchivistClient()
            result = await client.get_classification_fact("individual-123")
            
            mock_send.assert_called_once_with(
                "archivist.fact/classification-get", 
                {"uid": "individual-123"}
            ) 


@pytest.mark.asyncio
@pytest.mark.unit
class TestArchivistClientEntityOperations:
    """Test ArchivistClient individual and kind operations."""

    async def test_get_individual(self):
        """Test getting an individual by UID."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "ind-123", "name": "John Smith"}
            
            client = ArchivistClient()
            result = await client.get_individual("ind-123")
            
            mock_send.assert_called_once_with(
                "archivist.individual/get", 
                {"uid": "ind-123"}
            )

    async def test_create_individual(self):
        """Test creating a new individual."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "ind-456", "created": True}
            
            client = ArchivistClient()
            individual_data = {"name": "Jane Doe", "kind_uid": "person"}
            result = await client.create_individual(individual_data)
            
            mock_send.assert_called_once_with("archivist.individual/create", individual_data)

    async def test_update_individual(self):
        """Test updating an existing individual."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "ind-123", "updated": True}
            
            client = ArchivistClient()
            result = await client.update_individual("ind-123", {"name": "John A. Smith"})
            
            mock_send.assert_called_once_with(
                "archivist.individual/update", 
                {"name": "John A. Smith", "uid": "ind-123"}
            )

    async def test_get_kind(self):
        """Test getting a kind by UID."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "kind-123", "name": "Person"}
            
            client = ArchivistClient()
            result = await client.get_kind("kind-123")
            
            mock_send.assert_called_once_with(
                "archivist.kind/get", 
                {"uid": "kind-123"}
            )

    async def test_create_kind(self):
        """Test creating a new kind."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "kind-456", "created": True}
            
            client = ArchivistClient()
            kind_data = {"name": "Vehicle", "supertype_uid": "physical-object"}
            result = await client.create_kind(kind_data)
            
            mock_send.assert_called_once_with("archivist.kind/create", kind_data)

    async def test_update_kind(self):
        """Test updating an existing kind."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "kind-123", "updated": True}
            
            client = ArchivistClient()
            result = await client.update_kind("kind-123", {"description": "Human being"})
            
            mock_send.assert_called_once_with(
                "archivist.kind/update", 
                {"description": "Human being", "uid": "kind-123"}
            )


@pytest.mark.asyncio
@pytest.mark.unit
class TestArchivistClientTransactionOperations:
    """Test ArchivistClient transaction operations."""

    async def test_get_transaction(self):
        """Test getting a transaction by UID."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "tx-123", "status": "committed"}
            
            client = ArchivistClient()
            result = await client.get_transaction("tx-123")
            
            mock_send.assert_called_once_with(
                "archivist.transaction/get", 
                {"uid": "tx-123"}
            )

    async def test_create_transaction(self):
        """Test creating a new transaction."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"uid": "tx-456", "created": True}
            
            client = ArchivistClient()
            tx_data = {"operations": [{"type": "create", "entity": "new-entity"}]}
            result = await client.create_transaction(tx_data)
            
            mock_send.assert_called_once_with("archivist.transaction/create", tx_data)

    async def test_commit_transaction(self):
        """Test committing a transaction."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"committed": True, "timestamp": "2024-01-01T12:00:00Z"}
            
            client = ArchivistClient()
            result = await client.commit_transaction("tx-123")
            
            mock_send.assert_called_once_with(
                "archivist.transaction/commit", 
                {"uid": "tx-123"}
            )

    async def test_rollback_transaction(self):
        """Test rolling back a transaction."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"rolled_back": True}
            
            client = ArchivistClient()
            result = await client.rollback_transaction("tx-123")
            
            mock_send.assert_called_once_with(
                "archivist.transaction/rollback", 
                {"uid": "tx-123"}
            )

    async def test_validate_entity(self):
        """Test validating an entity."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"valid": True, "errors": []}
            
            client = ArchivistClient()
            entity_data = {"uid": "test-entity", "name": "Test"}
            result = await client.validate_entity(entity_data)
            
            mock_send.assert_called_once_with("archivist.validation/validate", entity_data) 


@pytest.mark.asyncio
@pytest.mark.unit
class TestArchivistClientProxy:
    """Test ArchivistClientProxy functionality and context injection."""

    def test_proxy_initialization(self):
        """Test ArchivistClientProxy initialization."""
        proxy = ArchivistClientProxy("user-123", "env-456")
        
        assert proxy.user_id == "user-123"
        assert proxy.env_id == "env-456"
        assert proxy._target_client == archivist_client

    async def test_proxy_connection_forwarding(self):
        """Test that proxy forwards connection methods directly."""
        proxy = ArchivistClientProxy("user-123", "env-456")
        
        with patch.object(proxy._target_client, 'connect', new_callable=AsyncMock) as mock_connect:
            mock_connect.return_value = True
            
            result = await proxy.connect()
            
            assert result is True
            mock_connect.assert_called_once()

    async def test_proxy_method_forwarding(self):
        """Test that proxy correctly forwards method calls."""
        proxy = ArchivistClientProxy("user-123", "env-456")
        
        with patch.object(proxy._target_client, 'get_kinds', new_callable=AsyncMock) as mock_get_kinds:
            mock_get_kinds.return_value = {"kinds": []}
            
            result = await proxy.get_kinds({"limit": 10})
            
            mock_get_kinds.assert_called_once_with({"limit": 10})
            assert result == {"kinds": []}

    async def test_proxy_call_method(self):
        """Test the internal _proxy_call method."""
        proxy = ArchivistClientProxy("user-123", "env-456")
        
        with patch.object(proxy._target_client, 'get_individual', new_callable=AsyncMock) as mock_method:
            mock_method.return_value = {"uid": "ind-123"}
            
            result = await proxy._proxy_call('get_individual', "ind-123")
            
            mock_method.assert_called_once_with("ind-123")
            assert result == {"uid": "ind-123"}


@pytest.mark.asyncio
@pytest.mark.unit
class TestArchivistClientIntegration:
    """Test ArchivistClient integration scenarios and workflows."""

    async def test_entity_creation_workflow(self):
        """Test complete entity creation workflow."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            # Mock responses for create workflow
            mock_send.side_effect = [
                {"uid": "kind-person", "created": True},  # create_kind
                {"uid": "ind-john", "created": True},     # create_individual  
                {"uid": "fact-age", "created": True}      # create_fact
            ]
            
            client = ArchivistClient()
            
            # Create kind
            kind_result = await client.create_kind({"name": "Person"})
            assert kind_result["uid"] == "kind-person"
            
            # Create individual
            ind_result = await client.create_individual({
                "name": "John Doe", 
                "kind_uid": "kind-person"
            })
            assert ind_result["uid"] == "ind-john"
            
            # Add fact
            fact_result = await client.create_fact({
                "lh_object_uid": "ind-john",
                "rel_type_uid": "has-age", 
                "rh_object_uid": "30"
            })
            assert fact_result["uid"] == "fact-age"

    async def test_search_and_retrieve_workflow(self):
        """Test search and retrieve workflow."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = [
                {"matches": [{"uid": "ind-1", "score": 0.95}]},  # text_search
                {"uid": "ind-1", "name": "John Smith"},           # get_individual
                {"facts": [{"uid": "fact-1"}]}                    # get_all_related
            ]
            
            client = ArchivistClient()
            
            # Search for entity
            search_result = await client.text_search({"query": "John Smith"})
            entity_uid = search_result["matches"][0]["uid"]
            
            # Retrieve full entity
            entity = await client.get_individual(entity_uid)
            assert entity["name"] == "John Smith"
            
            # Get related facts
            facts = await client.get_all_related(entity_uid)
            assert len(facts["facts"]) == 1

    async def test_transaction_workflow(self):
        """Test transaction management workflow."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = [
                {"uid": "tx-123", "created": True},      # create_transaction
                {"uid": "fact-1", "created": True},      # create_fact (in transaction)
                {"committed": True}                       # commit_transaction
            ]
            
            client = ArchivistClient()
            
            # Start transaction
            tx_result = await client.create_transaction({
                "operations": [{"type": "create_fact", "data": {}}]
            })
            tx_uid = tx_result["uid"]
            
            # Perform operations
            fact_result = await client.create_fact({
                "lh_object_uid": "entity-1",
                "rel_type_uid": "relates-to",
                "rh_object_uid": "entity-2",
                "transaction_uid": tx_uid
            })
            
            # Commit transaction
            commit_result = await client.commit_transaction(tx_uid)
            assert commit_result["committed"] is True 

    async def test_knowledge_graph_exploration(self):
        """Test knowledge graph exploration workflow."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = [
                {"results": [{"uid": "person-1"}]},              # execute_query
                {"entities": [{"uid": "related-1"}]},            # get_related_to
                {"subtypes": [{"uid": "student"}, {"uid": "teacher"}]},  # get_subtypes
                {"hierarchy": [{"level": 0, "uid": "person"}]}   # get_specialization_hierarchy
            ]
            
            client = ArchivistClient()
            
            # Find entities of interest
            query_result = await client.execute_query(
                "MATCH (p:Person) WHERE p.age > 18 RETURN p"
            )
            
            # Explore relationships
            related = await client.get_related_to("person-1", "knows")
            
            # Explore type hierarchy
            subtypes = await client.get_subtypes("person")
            assert len(subtypes["subtypes"]) == 2
            
            # Get specialization hierarchy
            hierarchy = await client.get_specialization_hierarchy("user-1", "person")
            assert len(hierarchy["hierarchy"]) == 1

    async def test_data_validation_workflow(self):
        """Test data validation before operations."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = [
                {"valid": True, "errors": []},        # validate_entity
                {"uid": "validated-entity", "created": True}  # create_individual
            ]
            
            client = ArchivistClient()
            
            # Validate entity before creation
            entity_data = {"name": "Test Entity", "kind_uid": "person"}
            validation = await client.validate_entity(entity_data)
            
            assert validation["valid"] is True
            
            # Create entity if valid
            if validation["valid"]:
                result = await client.create_individual(entity_data)
                assert result["created"] is True

    async def test_error_recovery_workflow(self):
        """Test error recovery and cleanup workflow."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = [
                {"uid": "tx-failed", "created": True},   # create_transaction
                {"error": "Operation failed"},           # create_fact (fails)
                {"rolled_back": True}                    # rollback_transaction
            ]
            
            client = ArchivistClient()
            
            # Start transaction
            tx_result = await client.create_transaction({"operations": []})
            tx_uid = tx_result["uid"]
            
            # Attempt operation that fails
            fact_result = await client.create_fact({
                "invalid": "data",
                "transaction_uid": tx_uid
            })
            
            # Check if operation failed
            if "error" in fact_result:
                # Rollback transaction on error
                rollback = await client.rollback_transaction(tx_uid)
                assert rollback["rolled_back"] is True


@pytest.mark.asyncio
@pytest.mark.unit
class TestArchivistClientAdvancedOperations:
    """Test ArchivistClient advanced and complex operations."""

    async def test_core_sample_operations(self):
        """Test core sample retrieval operations."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = [
                {"samples": [{"uid": "sample-1"}]},    # get_core_sample
                {"samples": [{"uid": "rh-sample-1"}]}  # get_core_sample_rh
            ]
            
            client = ArchivistClient()
            
            # Get left-hand core samples
            lh_samples = await client.get_core_sample("entity-1", "relation-type")
            assert len(lh_samples["samples"]) == 1
            
            # Get right-hand core samples
            rh_samples = await client.get_core_sample_rh("entity-1", "relation-type")
            assert len(rh_samples["samples"]) == 1

    async def test_subtype_cone_operations(self):
        """Test subtype cone operations."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = [
                {"entities": [{"uid": "related-1"}]},   # get_related_on_uid_subtype_cone
                {"entities": [{"uid": "subtype-1"}]}    # get_related_to_subtype_cone
            ]
            
            client = ArchivistClient()
            
            # Get related entities via subtype cone
            related = await client.get_related_on_uid_subtype_cone("obj-1", "rel-type")
            assert len(related["entities"]) == 1
            
            # Get related-to via subtype cone
            related_to = await client.get_related_to_subtype_cone("obj-1", "rel-type")
            assert len(related_to["entities"]) == 1

    async def test_classification_operations(self):
        """Test classification and type operations."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = [
                {"classification": {"uid": "class-fact"}},  # get_classification_fact
                {"entities": [{"uid": "classified-1"}]},    # get_classified
                {"subtypes": [{"uid": "direct-subtype"}]}   # get_subtypes
            ]
            
            client = ArchivistClient()
            
            # Get classification fact
            classification = await client.get_classification_fact("individual-1")
            assert "classification" in classification
            
            # Get classified entities
            classified = await client.get_classified("kind-1")
            assert len(classified["entities"]) == 1
            
            # Get direct subtypes
            subtypes = await client.get_subtypes("kind-1")
            assert len(subtypes["subtypes"]) == 1

    async def test_completion_and_suggestion_operations(self):
        """Test completion and suggestion operations."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {
                "completions": ["Person", "Personal", "Personality"],
                "suggestions": ["John", "Jane", "Jack"]
            }
            
            client = ArchivistClient()
            
            result = await client.get_completions({
                "prefix": "Per",
                "context": "entity-names",
                "limit": 10
            })
            
            assert len(result["completions"]) == 3
            assert "Person" in result["completions"]

    async def test_search_operations_comprehensive(self):
        """Test comprehensive search operations."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = [
                {"matches": [{"uid": "uid-1"}]},                    # uid_search
                {"individuals": [{"uid": "ind-1"}]},                # individual_search  
                {"kinds": [{"uid": "kind-1"}]},                     # kind_search
                {"hierarchy": [{"uid": "hierarchy-1"}]}             # get_specialization_hierarchy
            ]
            
            client = ArchivistClient()
            
            # Test UID search
            uid_results = await client.uid_search({"pattern": "person-*"})
            assert len(uid_results["matches"]) == 1
            
            # Test individual search
            ind_results = await client.individual_search({"name": "John"})
            assert len(ind_results["individuals"]) == 1
            
            # Test kind search
            kind_results = await client.kind_search({"category": "living"})
            assert len(kind_results["kinds"]) == 1
            
            # Test specialization hierarchy
            hierarchy = await client.get_specialization_hierarchy("user-1", "entity-1")
            assert len(hierarchy["hierarchy"]) == 1

    async def test_entity_relationships_exploration(self):
        """Test comprehensive entity relationship exploration."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = [
                {"facts": [{"uid": "fact-1"}]},                     # get_all_related
                {"facts": [{"uid": "rel-fact-1"}]},                 # get_facts_relating_entities
                {"relations": [{"uid": "inherited-1"}]},            # get_inherited_relation
                {"entities": [{"uid": "related-1"}]}                # get_related_to
            ]
            
            client = ArchivistClient()
            
            # Get all related facts
            related_facts = await client.get_all_related("entity-1")
            assert len(related_facts["facts"]) == 1
            
            # Get facts relating two entities
            relating_facts = await client.get_facts_relating_entities("entity-1", "entity-2")
            assert len(relating_facts["facts"]) == 1
            
            # Get inherited relations
            inherited = await client.get_inherited_relation("entity-1", "is-a")
            assert len(inherited["relations"]) == 1
            
            # Get related entities
            related_entities = await client.get_related_to("entity-1", "knows")
            assert len(related_entities["entities"]) == 1


@pytest.mark.asyncio
@pytest.mark.unit
class TestArchivistClientErrorHandling:
    """Test ArchivistClient error handling and edge cases."""

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    async def test_send_message_exception_handling(self, mock_websocket):
        """Test exception handling during message sending."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_client_instance.send.side_effect = Exception("Network error")
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        client.connected = True
        
        result = await client._send_message("test.error", {})
        
        assert "error" in result
        assert "Network error" in result["error"]

    @patch('src.relica_nous_langchain.services.archivist_client.WebSocketClient')
    async def test_heartbeat_error_handling(self, mock_websocket):
        """Test heartbeat error handling."""
        # Use our helper to create a proper mock
        mock_client_instance = create_websocket_mock()
        mock_client_instance.send.side_effect = Exception("Send failed")
        mock_websocket.return_value = mock_client_instance
        
        client = ArchivistClient()
        client.connected = True
        
        # Should not raise exception
        await client.send_heartbeat()
        
        # Verify send was attempted
        mock_client_instance.send.assert_called_once()

    async def test_query_with_missing_parameters(self):
        """Test query execution with missing parameters."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"error": "Missing required parameter"}
            
            client = ArchivistClient()
            result = await client.execute_query("")  # Empty query
            
            assert "error" in result

    async def test_invalid_uid_operations(self):
        """Test operations with invalid UIDs."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"error": "Invalid UID format", "code": 400}
            
            client = ArchivistClient()
            result = await client.get_individual("invalid-uid-format")
            
            assert result["error"] == "Invalid UID format"
            assert result["code"] == 400

    async def test_transaction_rollback_on_error(self):
        """Test transaction rollback when errors occur."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"rolled_back": True, "reason": "Operation failed"}
            
            client = ArchivistClient()
            result = await client.rollback_transaction("failed-tx-123")
            
            assert result["rolled_back"] is True

    async def test_large_result_set_handling(self):
        """Test handling of large result sets."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            # Simulate large result set
            large_results = [{"uid": f"entity-{i}"} for i in range(1000)]
            mock_send.return_value = {"entities": large_results, "total": 1000}
            
            client = ArchivistClient()
            result = await client.resolve_uids([f"entity-{i}" for i in range(1000)])
            
            assert len(result["entities"]) == 1000

    async def test_concurrent_operation_handling(self):
        """Test handling of concurrent operations."""
        with patch.object(ArchivistClient, '_send_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = {"success": True}
            
            client = ArchivistClient()
            
            # Simulate concurrent operations
            tasks = [
                client.get_individual(f"ind-{i}") 
                for i in range(10)
            ]
            
            results = await asyncio.gather(*tasks)
            
            assert len(results) == 10
            assert mock_send.call_count == 10 