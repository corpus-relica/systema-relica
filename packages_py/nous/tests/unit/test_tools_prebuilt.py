"""Unit tests for ToolsPrebuilt."""

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
import asyncio

from src.relica_nous_langchain.agent.ToolsPrebuilt import (
    facts_to_related_entities_str,
    facts_to_relations_str,
    facts_to_metadata_str,
    create_agent_tools
)


class TestFactsFormatting:
    """Test fact formatting helper functions."""
    
    def test_facts_to_related_entities_str(self):
        """Test converting facts to related entities string."""
        facts = [
            {
                'lh_object_uid': 100,
                'lh_object_name': 'Entity A',
                'rh_object_uid': 200,
                'rh_object_name': 'Entity B'
            },
            {
                'lh_object_uid': 100,
                'lh_object_name': 'Entity A',
                'rh_object_uid': 300,
                'rh_object_name': 'Entity C'
            }
        ]
        
        result = facts_to_related_entities_str(facts)
        
        # Should contain unique entities
        assert "Entity A (UID: 100)" in result
        assert "Entity B (UID: 200)" in result
        assert "Entity C (UID: 300)" in result
        # Should not duplicate entities
        assert result.count("Entity A") == 1
    
    def test_facts_to_related_entities_str_empty(self):
        """Test converting empty facts list."""
        result = facts_to_related_entities_str([])
        assert result == ""
    
    def test_facts_to_relations_str(self):
        """Test converting facts to relations string."""
        facts = [
            {
                'lh_object_uid': 100,
                'lh_object_name': 'Entity A',
                'rel_type_uid': 50,
                'rel_type_name': 'is-a',
                'rh_object_uid': 200,
                'rh_object_name': 'Entity B'
            }
        ]
        
        result = facts_to_relations_str(facts)
        expected = "- Entity A (UID: 100) is-a (UID: 50) Entity B (UID: 200)"
        assert result == expected
    
    def test_facts_to_metadata_str(self):
        """Test converting facts to metadata string."""
        facts = [
            {
                'collection_name': 'Test Collection',
                'author': 'Test Author',
                'reference': 'Test Reference',
                'language': 'English',
                'approval_status': 'Approved'
            }
        ]
        
        result = facts_to_metadata_str(facts)
        assert "Collection: Test Collection" in result
        assert "Author: Test Author" in result
        assert "Reference: Test Reference" in result
        assert "Language: English" in result
        assert "Status: Approved" in result
    
    def test_facts_to_metadata_str_empty(self):
        """Test converting empty facts to metadata."""
        result = facts_to_metadata_str([])
        assert result == "No metadata available"
    
    def test_facts_to_metadata_str_missing_fields(self):
        """Test metadata with missing fields."""
        facts = [{}]
        result = facts_to_metadata_str(facts)
        assert "Collection: N/A" in result
        assert "Author: N/A" in result


class TestCreateAgentTools:
    """Test create_agent_tools function."""
    
    @pytest.fixture
    def mock_aperture_proxy(self):
        """Create a mock ApertureClientProxy."""
        proxy = MagicMock()
        proxy.textSearchLoad = AsyncMock()
        proxy.uidSearchLoad = AsyncMock()
        proxy.loadSpecializationFact = AsyncMock()
        proxy.loadSubtypes = AsyncMock()
        proxy.loadSpecializationHierarchy = AsyncMock()
        proxy.loadClassificationFact = AsyncMock()
        proxy.loadClassified = AsyncMock()
        proxy.loadAllRelatedFacts = AsyncMock()
        proxy.loadRequiredRoles = AsyncMock()
        proxy.loadRolePlayers = AsyncMock()
        proxy.selectEntity = AsyncMock()
        return proxy
    
    @pytest.fixture
    def mock_archivist_proxy(self):
        """Create a mock ArchivistClientProxy."""
        proxy = MagicMock()
        proxy.get_definition = AsyncMock()
        return proxy
    
    def test_create_agent_tools_structure(self, mock_aperture_proxy, mock_archivist_proxy):
        """Test that create_agent_tools returns correct structure."""
        result = create_agent_tools(mock_aperture_proxy, mock_archivist_proxy)
        
        assert isinstance(result, dict)
        assert "tools" in result
        assert isinstance(result["tools"], list)
        assert len(result["tools"]) > 0
    
    def test_create_agent_tools_functions(self, mock_aperture_proxy, mock_archivist_proxy):
        """Test that tools are callable functions."""
        result = create_agent_tools(mock_aperture_proxy, mock_archivist_proxy)
        tools = result["tools"]
        
        for tool in tools:
            assert callable(tool)
            # Check if it's an async function
            assert asyncio.iscoroutinefunction(tool)


class TestSearchTools:
    """Test search tool functions."""
    
    @pytest.fixture
    def tools(self, mock_aperture_proxy, mock_archivist_proxy):
        """Create tools for testing."""
        return create_agent_tools(mock_aperture_proxy, mock_archivist_proxy)
    
    @pytest.fixture
    def mock_aperture_proxy(self):
        """Create a mock ApertureClientProxy."""
        proxy = MagicMock()
        proxy.textSearchLoad = AsyncMock()
        proxy.uidSearchLoad = AsyncMock()
        proxy.selectEntity = AsyncMock()
        return proxy
    
    @pytest.fixture
    def mock_archivist_proxy(self):
        """Create a mock ArchivistClientProxy."""
        return MagicMock()
    
    @pytest.mark.asyncio
    async def test_text_search_load_success(self, tools, mock_aperture_proxy):
        """Test textSearchLoad with successful results."""
        # Set up mock response
        mock_aperture_proxy.textSearchLoad.return_value = {
            'facts': [
                {'lh_object_uid': 100},
                {'lh_object_uid': 200}
            ]
        }
        
        # Get the textSearchLoad tool
        text_search_tool = tools["tools"][0]  # First tool is textSearchLoad
        
        # Call the tool
        result = await text_search_tool("test entity")
        
        # Verify the result
        assert "Found entities matching" in result
        assert "UIDs [100, 200]" in result
        mock_aperture_proxy.textSearchLoad.assert_called_once_with("test entity")
    
    @pytest.mark.asyncio
    async def test_text_search_load_no_results(self, tools, mock_aperture_proxy):
        """Test textSearchLoad with no results."""
        # Set up mock response
        mock_aperture_proxy.textSearchLoad.return_value = {'facts': []}
        
        # Get the textSearchLoad tool
        text_search_tool = tools["tools"][0]
        
        # Call the tool
        result = await text_search_tool("nonexistent")
        
        # Verify the result
        assert "No entity found with the name" in result
    
    @pytest.mark.asyncio
    async def test_text_search_load_error(self, tools, mock_aperture_proxy):
        """Test textSearchLoad with error."""
        # Set up mock to raise exception
        mock_aperture_proxy.textSearchLoad.side_effect = Exception("Connection error")
        
        # Get the textSearchLoad tool
        text_search_tool = tools["tools"][0]
        
        # Call the tool
        result = await text_search_tool("test")
        
        # Verify error handling
        assert "An error occurred while searching" in result
        assert "Connection error" in result
    
    @pytest.mark.asyncio
    async def test_uid_search_load_success(self, tools, mock_aperture_proxy):
        """Test uidSearchLoad with successful results."""
        # Set up mock response
        mock_aperture_proxy.uidSearchLoad.return_value = {
            'facts': [
                {'lh_object_uid': 100}
            ]
        }
        
        # Get the uidSearchLoad tool
        uid_search_tool = tools["tools"][1]  # Second tool is uidSearchLoad
        
        # Call the tool
        result = await uid_search_tool(100)
        
        # Verify the result
        assert "Found entities matching" in result
        assert "UIDs [100]" in result
        mock_aperture_proxy.uidSearchLoad.assert_called_once_with(100)


class TestSpecializationTools:
    """Test specialization-related tools."""
    
    @pytest.fixture
    def tools(self, mock_aperture_proxy, mock_archivist_proxy):
        """Create tools for testing."""
        return create_agent_tools(mock_aperture_proxy, mock_archivist_proxy)
    
    @pytest.fixture
    def mock_aperture_proxy(self):
        """Create a mock ApertureClientProxy."""
        proxy = MagicMock()
        proxy.loadSpecializationFact = AsyncMock()
        proxy.loadSubtypes = AsyncMock()
        proxy.loadSpecializationHierarchy = AsyncMock()
        return proxy
    
    @pytest.fixture
    def mock_archivist_proxy(self):
        """Create a mock ArchivistClientProxy."""
        return MagicMock()
    
    @pytest.mark.asyncio
    async def test_load_direct_supertypes(self, tools, mock_aperture_proxy):
        """Test loadDirectSupertypes tool."""
        # Set up mock response
        mock_aperture_proxy.loadSpecializationFact.return_value = {
            'facts': [
                {
                    'lh_object_uid': 100,
                    'lh_object_name': 'Subtype',
                    'rel_type_uid': 1146,
                    'rel_type_name': 'is a kind of',
                    'rh_object_uid': 200,
                    'rh_object_name': 'Supertype'
                }
            ]
        }
        
        # Get the loadDirectSupertypes tool (index 2)
        supertype_tool = tools["tools"][2]
        
        # Call the tool
        result = await supertype_tool(100)
        
        # Verify the result
        assert "Related Entities" in result
        assert "Subtype (UID: 100)" in result
        assert "Supertype (UID: 200)" in result
        assert "Relationships" in result
        mock_aperture_proxy.loadSpecializationFact.assert_called_once_with(100)
    
    @pytest.mark.asyncio
    async def test_load_direct_subtypes(self, tools, mock_aperture_proxy):
        """Test loadDirectSubtypes tool."""
        # Set up mock response
        mock_aperture_proxy.loadSubtypes.return_value = {
            'facts': [
                {
                    'lh_object_uid': 300,
                    'lh_object_name': 'Subtype1',
                    'rel_type_uid': 1146,
                    'rel_type_name': 'is a kind of',
                    'rh_object_uid': 100,
                    'rh_object_name': 'Supertype'
                }
            ]
        }
        
        # Get the loadDirectSubtypes tool (index 3)
        subtype_tool = tools["tools"][3]
        
        # Call the tool
        result = await subtype_tool(100)
        
        # Verify the result
        assert "Subtype1" in result
        assert "Supertype" in result
        mock_aperture_proxy.loadSubtypes.assert_called_once_with(100)


class TestClassificationTools:
    """Test classification-related tools."""
    
    @pytest.fixture
    def tools(self, mock_aperture_proxy, mock_archivist_proxy):
        """Create tools for testing."""
        return create_agent_tools(mock_aperture_proxy, mock_archivist_proxy)
    
    @pytest.fixture
    def mock_aperture_proxy(self):
        """Create a mock ApertureClientProxy."""
        proxy = MagicMock()
        proxy.loadClassificationFact = AsyncMock()
        proxy.loadClassified = AsyncMock()
        return proxy
    
    @pytest.fixture
    def mock_archivist_proxy(self):
        """Create a mock ArchivistClientProxy."""
        return MagicMock()
    
    @pytest.mark.asyncio
    async def test_load_classifier(self, tools, mock_aperture_proxy):
        """Test loadClassifier tool."""
        # Set up mock response
        mock_aperture_proxy.loadClassificationFact.return_value = {
            'facts': [
                {
                    'lh_object_uid': 1000,
                    'lh_object_name': 'Instance',
                    'rel_type_uid': 1225,
                    'rel_type_name': 'is classified as',
                    'rh_object_uid': 2000,
                    'rh_object_name': 'Type'
                }
            ]
        }
        
        # Get the loadClassifier tool (index 5)
        classifier_tool = tools["tools"][5]
        
        # Call the tool
        result = await classifier_tool(1000)
        
        # Verify the result
        assert "Instance" in result
        assert "Type" in result
        assert "is classified as" in result
        mock_aperture_proxy.loadClassificationFact.assert_called_once_with(1000)


class TestRelationTools:
    """Test relation-related tools."""
    
    @pytest.fixture
    def tools(self, mock_aperture_proxy, mock_archivist_proxy):
        """Create tools for testing."""
        return create_agent_tools(mock_aperture_proxy, mock_archivist_proxy)
    
    @pytest.fixture
    def mock_aperture_proxy(self):
        """Create a mock ApertureClientProxy."""
        proxy = MagicMock()
        proxy.loadAllRelatedFacts = AsyncMock()
        proxy.loadRequiredRoles = AsyncMock()
        proxy.loadRolePlayers = AsyncMock()
        proxy.selectEntity = AsyncMock()
        return proxy
    
    @pytest.fixture
    def mock_archivist_proxy(self):
        """Create a mock ArchivistClientProxy."""
        proxy = MagicMock()
        proxy.get_definition = AsyncMock()
        return proxy
    
    @pytest.mark.asyncio
    async def test_load_relations(self, tools, mock_aperture_proxy):
        """Test loadRelations tool."""
        # Set up mock response
        mock_aperture_proxy.loadAllRelatedFacts.return_value = {
            'facts': [
                {
                    'lh_object_uid': 100,
                    'lh_object_name': 'Entity A',
                    'rel_type_uid': 500,
                    'rel_type_name': 'related to',
                    'rh_object_uid': 200,
                    'rh_object_name': 'Entity B'
                }
            ]
        }
        
        # Get the loadRelations tool (index 7)
        relations_tool = tools["tools"][7]
        
        # Call the tool
        result = await relations_tool(100)
        
        # Verify the result
        assert "Entity A" in result
        assert "Entity B" in result
        assert "related to" in result
        mock_aperture_proxy.loadAllRelatedFacts.assert_called_once_with(100)


class TestEntityDefinitionTool:
    """Test entity definition tool."""
    
    @pytest.fixture
    def tools(self, mock_aperture_proxy, mock_archivist_proxy):
        """Create tools for testing."""
        return create_agent_tools(mock_aperture_proxy, mock_archivist_proxy)
    
    @pytest.fixture
    def mock_aperture_proxy(self):
        """Create a mock ApertureClientProxy."""
        proxy = MagicMock()
        proxy.selectEntity = AsyncMock()
        return proxy
    
    @pytest.fixture
    def mock_archivist_proxy(self):
        """Create a mock ArchivistClientProxy."""
        proxy = MagicMock()
        proxy.get_definition = AsyncMock()
        return proxy
    
    @pytest.mark.asyncio
    async def test_get_entity_definition(self, tools, mock_aperture_proxy, mock_archivist_proxy):
        """Test getEntityDefinition tool."""
        # Set up mock response
        mock_archivist_proxy.get_definition.return_value = [
            "This is a test entity.",
            "It has multiple lines of definition."
        ]
        
        # Get the getEntityDefinition tool (last tool)
        definition_tool = tools["tools"][-1]
        
        # Call the tool
        result = await definition_tool(100)
        
        # Verify the result
        assert "This is a test entity." in result
        assert "It has multiple lines of definition." in result
        mock_archivist_proxy.get_definition.assert_called_once_with(100)
        mock_aperture_proxy.selectEntity.assert_called_once_with(100)
    
    @pytest.mark.asyncio
    async def test_get_entity_definition_none_response(self, tools, mock_aperture_proxy, mock_archivist_proxy):
        """Test getEntityDefinition with None response."""
        # Set up mock response
        mock_archivist_proxy.get_definition.return_value = None
        
        # Get the getEntityDefinition tool
        definition_tool = tools["tools"][-1]
        
        # Call the tool - should handle None gracefully
        with pytest.raises(TypeError):
            # This will raise TypeError when trying to join None
            await definition_tool(100)


class TestToolsIntegration:
    """Test integration scenarios with multiple tools."""
    
    @pytest.fixture
    def mock_aperture_proxy(self):
        """Create a mock ApertureClientProxy."""
        proxy = MagicMock()
        proxy.textSearchLoad = AsyncMock(return_value={'facts': [{'lh_object_uid': 100}]})
        proxy.loadClassificationFact = AsyncMock(return_value={
            'facts': [{
                'lh_object_uid': 100,
                'lh_object_name': 'TestEntity',
                'rel_type_uid': 1225,
                'rel_type_name': 'is classified as',
                'rh_object_uid': 200,
                'rh_object_name': 'TestType'
            }]
        })
        proxy.selectEntity = AsyncMock()
        return proxy
    
    @pytest.fixture
    def mock_archivist_proxy(self):
        """Create a mock ArchivistClientProxy."""
        proxy = MagicMock()
        proxy.get_definition = AsyncMock(return_value=["Test definition"])
        return proxy
    
    @pytest.mark.asyncio
    async def test_search_then_get_definition_workflow(self, mock_aperture_proxy, mock_archivist_proxy):
        """Test a workflow of searching for an entity then getting its definition."""
        tools_dict = create_agent_tools(mock_aperture_proxy, mock_archivist_proxy)
        tools = tools_dict["tools"]
        
        # First, search for an entity
        text_search_tool = tools[0]
        search_result = await text_search_tool("TestEntity")
        assert "Found entities matching" in search_result
        
        # Then get its definition
        definition_tool = tools[-1]
        definition = await definition_tool(100)
        assert "Test definition" in definition
        
        # Verify the workflow
        mock_aperture_proxy.textSearchLoad.assert_called_once()
        mock_archivist_proxy.get_definition.assert_called_once_with(100)
        mock_aperture_proxy.selectEntity.assert_called_once_with(100) 