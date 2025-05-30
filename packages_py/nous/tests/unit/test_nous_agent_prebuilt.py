"""
Unit tests for NOUSAgentPrebuilt class.

Tests the complete NOUS agent functionality including:
- Agent initialization and configuration
- Tool integration and dependencies
- Message handling and conversation flow
- System prompt generation and context
- Error handling and recovery scenarios
- Agent state management
"""

import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from src.relica_nous_langchain.agent.NOUSAgentPrebuilt import NOUSAgent, prompt
from src.relica_nous_langchain.services.aperture_client import ApertureClientProxy
from src.relica_nous_langchain.services.archivist_client import ArchivistClientProxy
from src.relica_nous_langchain.SemanticModel import SemanticModel

from langchain_core.runnables import RunnableConfig
from langgraph.prebuilt.chat_agent_executor import AgentState


@pytest.mark.unit
@pytest.mark.asyncio
class TestNOUSAgentInitialization:
    """Test NOUS agent initialization and configuration."""
    
    async def test_nous_agent_initialization(self, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test basic NOUS agent initialization."""
        # Create agent
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        # Verify initialization
        assert agent.aperture_client == mock_aperture_client
        assert agent.semantic_model == mock_semantic_model
        assert hasattr(agent, 'conversation_history')
        assert isinstance(agent.conversation_history, list)
        assert len(agent.conversation_history) == 0
        
        # Verify event emitter
        assert hasattr(agent, 'emitter')
        assert agent.emitter is not None
        
        # Verify conversation ID generation
        assert hasattr(agent, 'conversation_id')
        assert isinstance(agent.conversation_id, str)
        assert len(agent.conversation_id) > 0
        
        # Verify app (LangGraph workflow) is created
        assert hasattr(agent, 'app')
        assert agent.app is not None
    
    async def test_agent_dependencies_injection(self, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test that all required dependencies are properly injected."""
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        # Verify aperture client configuration
        assert agent.aperture_client.user_id == "test_user"
        assert agent.aperture_client.env_id == "test_env"
        
        # Verify semantic model
        assert agent.semantic_model.selectedEntity == 0
        assert hasattr(agent.semantic_model, 'format_relationships')
    
    async def test_conversation_id_uniqueness(self, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test that each agent instance gets a unique conversation ID."""
        agent1 = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        agent2 = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        assert agent1.conversation_id != agent2.conversation_id
        
        # Verify they are valid UUIDs
        uuid.UUID(agent1.conversation_id)  # Will raise ValueError if invalid
        uuid.UUID(agent2.conversation_id)  # Will raise ValueError if invalid


@pytest.mark.unit
@pytest.mark.asyncio
class TestNOUSAgentMessageHandling:
    """Test NOUS agent message handling and conversation flow."""
    
    async def test_handle_input_basic_functionality(self, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test basic message handling functionality."""
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        # Mock the app.ainvoke method
        mock_final_state = {
            "messages": [
                MagicMock(content="Test response from NOUS agent")
            ]
        }
        agent.app.ainvoke = AsyncMock(return_value=mock_final_state)
        
        # Test message handling
        test_messages = [
            {"role": "user", "content": "What is the meaning of life?"}
        ]
        
        response = await agent.handleInput(test_messages)
        
        # Verify response
        assert response == "Test response from NOUS agent"
        
        # Verify app.ainvoke was called with correct parameters
        agent.app.ainvoke.assert_called_once()
        call_args = agent.app.ainvoke.call_args
        
        # Check the messages parameter
        assert call_args[0][0]["messages"] == test_messages
        
        # Check the config parameter
        config = call_args[1]["config"]
        assert "configurable" in config
        configurable = config["configurable"]
        assert "environment" in configurable
        assert "selected_entity" in configurable
        assert "user_id" in configurable
        assert "env_id" in configurable
        assert "timestamp" in configurable
    
    async def test_handle_input_with_conversation_history(self, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test handling input with conversation history."""
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        # Mock the app.ainvoke method
        mock_final_state = {
            "messages": [
                MagicMock(content="Response based on conversation history")
            ]
        }
        agent.app.ainvoke = AsyncMock(return_value=mock_final_state)
        
        # Test with multi-turn conversation
        conversation_messages = [
            {"role": "user", "content": "Hello, what is your name?"},
            {"role": "assistant", "content": "I am NOUS, an AI assistant."},
            {"role": "user", "content": "Can you help me with semantic modeling?"}
        ]
        
        response = await agent.handleInput(conversation_messages)
        
        assert response == "Response based on conversation history"
        
        # Verify the full conversation was passed
        call_args = agent.app.ainvoke.call_args
        assert call_args[0][0]["messages"] == conversation_messages
    
    async def test_handle_input_error_handling(self, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test error handling in message processing."""
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        # Mock the app.ainvoke to raise an exception
        agent.app.ainvoke = AsyncMock(side_effect=Exception("Test error"))
        
        test_messages = [
            {"role": "user", "content": "This should cause an error"}
        ]
        
        response = await agent.handleInput(test_messages)
        
        # Verify error handling
        assert "An error occurred during agent execution:" in response
        assert "Test error" in response
    
    async def test_handle_input_no_final_answer(self, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test handling when agent doesn't produce a final answer."""
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        # Mock the app.ainvoke to return None
        agent.app.ainvoke = AsyncMock(return_value=None)
        
        test_messages = [
            {"role": "user", "content": "Test message"}
        ]
        
        response = await agent.handleInput(test_messages)
        
        assert response == "Agent did not produce a final answer."


@pytest.mark.unit
class TestNOUSAgentPromptGeneration:
    """Test NOUS agent system prompt generation."""
    
    def test_prompt_function_basic(self):
        """Test basic prompt function with mock state and config."""
        # Create mock state and config
        mock_state = {
            "messages": [
                {"role": "user", "content": "Test message"}
            ]
        }
        
        mock_config = {
            "configurable": {
                "environment": "Test environment data",
                "selected_entity": 12345,
                "user_id": "test_user_123",
                "env_id": "test_env_456",
                "timestamp": "2025-05-29 18:00"
            }
        }
        
        result = prompt(mock_state, mock_config)
        
        # Verify result structure
        assert isinstance(result, list)
        assert len(result) >= 2  # System message + user messages
        
        # Verify system message
        system_message = result[0]
        assert system_message["role"] == "system"
        assert "NOUS" in system_message["content"]
        assert "Network for Ontological Understanding and Synthesis" in system_message["content"]
        
        # Verify environment context is included
        assert "Test environment data" in system_message["content"]
        assert "12345" in system_message["content"]  # selected_entity
        assert "test_user_123" in system_message["content"]  # user_id
        assert "test_env_456" in system_message["content"]  # env_id
        assert "2025-05-29 18:00" in system_message["content"]  # timestamp
        
        # Verify user messages are appended
        assert result[1:] == mock_state["messages"]
    
    def test_prompt_function_with_empty_environment(self):
        """Test prompt function with empty environment data."""
        mock_state = {
            "messages": [
                {"role": "user", "content": "Test with empty environment"}
            ]
        }
        
        mock_config = {
            "configurable": {
                "environment": "",
                "selected_entity": 0,
                "user_id": "user",
                "env_id": "env",
                "timestamp": "now"
            }
        }
        
        result = prompt(mock_state, mock_config)
        
        # Should still generate valid prompt
        assert isinstance(result, list)
        assert len(result) >= 2
        
        system_message = result[0]
        assert system_message["role"] == "system"
        assert "NOUS" in system_message["content"]
    
    def test_prompt_function_semantic_content(self):
        """Test that prompt contains key semantic modeling concepts."""
        mock_state = {"messages": []}
        mock_config = {
            "configurable": {
                "environment": "semantic test",
                "selected_entity": 1,
                "user_id": "test",
                "env_id": "test",
                "timestamp": "test"
            }
        }
        
        result = prompt(mock_state, mock_config)
        system_content = result[0]["content"]
        
        # Verify key semantic concepts are present
        semantic_concepts = [
            "Gellish semantic models",
            "Entity Universe",
            "Classification relation",
            "Specialization relation",
            "formal_semantic_basis",
            "environment_dynamics",
            "available_capabilities"
        ]
        
        for concept in semantic_concepts:
            assert concept in system_content, f"Missing semantic concept: {concept}"


@pytest.mark.unit
@pytest.mark.asyncio
class TestNOUSAgentConfiguration:
    """Test NOUS agent configuration and context management."""
    
    async def test_agent_configuration_with_different_entities(self, mock_aperture_client, mock_archivist_client):
        """Test agent configuration with different selected entities."""
        # Test with different selected entities
        entities = [0, 123, 456789, 999999]
        
        for entity_id in entities:
            mock_semantic_model = MagicMock()
            mock_semantic_model.selectedEntity = entity_id
            mock_semantic_model.format_relationships.return_value = f"Relationships for entity {entity_id}"
            
            agent = NOUSAgent(
                aperture_client=mock_aperture_client,
                archivist_client=mock_archivist_client,
                semantic_model=mock_semantic_model
            )
            
            # Mock the app.ainvoke method
            mock_final_state = {
                "messages": [MagicMock(content=f"Response for entity {entity_id}")]
            }
            agent.app.ainvoke = AsyncMock(return_value=mock_final_state)
            
            test_messages = [{"role": "user", "content": f"Query about entity {entity_id}"}]
            response = await agent.handleInput(test_messages)
            
            assert f"entity {entity_id}" in response
            
            # Verify configuration includes correct entity
            call_args = agent.app.ainvoke.call_args
            config = call_args[1]["config"]["configurable"]
            assert config["selected_entity"] == entity_id
    
    async def test_agent_environment_formatting(self, mock_aperture_client, mock_archivist_client):
        """Test that environment formatting is properly integrated."""
        mock_semantic_model = MagicMock()
        mock_semantic_model.selectedEntity = 123
        mock_semantic_model.format_relationships.return_value = "Formatted relationship data"
        
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        # Mock the app.ainvoke method
        mock_final_state = {
            "messages": [MagicMock(content="Environment formatted response")]
        }
        agent.app.ainvoke = AsyncMock(return_value=mock_final_state)
        
        test_messages = [{"role": "user", "content": "Test environment formatting"}]
        await agent.handleInput(test_messages)
        
        # Verify format_relationships was called
        mock_semantic_model.format_relationships.assert_called_once()
        
        # Verify environment data is passed to app
        call_args = agent.app.ainvoke.call_args
        config = call_args[1]["config"]["configurable"]
        assert config["environment"] == "Formatted relationship data"
    
    async def test_agent_timestamp_generation(self, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test that timestamps are properly generated and formatted."""
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        # Mock the app.ainvoke method
        mock_final_state = {
            "messages": [MagicMock(content="Timestamp test response")]
        }
        agent.app.ainvoke = AsyncMock(return_value=mock_final_state)
        
        test_messages = [{"role": "user", "content": "Test timestamp"}]
        
        # Record time before call
        before_call = datetime.now()
        await agent.handleInput(test_messages)
        after_call = datetime.now()
        
        # Verify timestamp format and validity
        call_args = agent.app.ainvoke.call_args
        config = call_args[1]["config"]["configurable"]
        timestamp_str = config["timestamp"]
        
        # Parse timestamp
        timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M")
        
        # Verify timestamp is within reasonable range
        assert before_call.replace(second=0, microsecond=0) <= timestamp <= after_call.replace(second=0, microsecond=0)


@pytest.mark.unit
@pytest.mark.asyncio
class TestNOUSAgentToolIntegration:
    """Test NOUS agent tool integration and dependencies."""
    
    @patch('src.relica_nous_langchain.agent.NOUSAgentPrebuilt.create_agent_tools')
    async def test_agent_tool_creation(self, mock_create_tools, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test that agent tools are properly created and integrated."""
        # Mock tool creation
        mock_tools = {
            'tools': [
                MagicMock(name='aperture_tool'),
                MagicMock(name='archivist_tool'),
                MagicMock(name='semantic_tool')
            ]
        }
        mock_create_tools.return_value = mock_tools
        
        # Create agent
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        # Verify tool creation was called with correct clients
        mock_create_tools.assert_called_once_with(
            mock_aperture_client,
            mock_archivist_client
        )
        
        # Verify agent has access to tools
        assert hasattr(agent, 'app')
    
    async def test_agent_with_tool_errors(self, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test agent behavior when tools encounter errors."""
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        # Mock the app.ainvoke to simulate tool error
        agent.app.ainvoke = AsyncMock(side_effect=Exception("Tool execution failed"))
        
        test_messages = [{"role": "user", "content": "Use a tool that will fail"}]
        response = await agent.handleInput(test_messages)
        
        # Verify error is handled gracefully
        assert "An error occurred during agent execution:" in response
        assert "Tool execution failed" in response


@pytest.mark.unit
@pytest.mark.asyncio
class TestNOUSAgentEdgeCases:
    """Test NOUS agent edge cases and error scenarios."""
    
    async def test_agent_with_empty_messages(self, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test agent behavior with empty message list."""
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        # Mock the app.ainvoke method
        mock_final_state = {
            "messages": [MagicMock(content="Empty message response")]
        }
        agent.app.ainvoke = AsyncMock(return_value=mock_final_state)
        
        # Test with empty messages
        empty_messages = []
        
        # This should handle the edge case gracefully
        with pytest.raises(IndexError):
            # The agent tries to access messages[-1]['content'] which will fail
            await agent.handleInput(empty_messages)
    
    async def test_agent_with_malformed_messages(self, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test agent behavior with malformed message structure."""
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        # Mock the app.ainvoke method
        mock_final_state = {
            "messages": [MagicMock(content="Malformed message response")]
        }
        agent.app.ainvoke = AsyncMock(return_value=mock_final_state)
        
        # Test with malformed messages
        malformed_messages = [
            {"role": "user"},  # Missing 'content'
            {"content": "test"},  # Missing 'role'
            {}  # Empty message
        ]
        
        for malformed in malformed_messages:
            with pytest.raises(KeyError):
                # The agent tries to access 'content' key which may not exist
                await agent.handleInput([malformed])
    
    async def test_agent_conversation_id_persistence(self, mock_aperture_client, mock_archivist_client, mock_semantic_model):
        """Test that conversation ID persists across multiple interactions."""
        agent = NOUSAgent(
            aperture_client=mock_aperture_client,
            archivist_client=mock_archivist_client,
            semantic_model=mock_semantic_model
        )
        
        original_id = agent.conversation_id
        
        # Mock the app.ainvoke method
        mock_final_state = {
            "messages": [MagicMock(content="Test response")]
        }
        agent.app.ainvoke = AsyncMock(return_value=mock_final_state)
        
        # Process multiple messages
        for i in range(3):
            test_messages = [{"role": "user", "content": f"Message {i}"}]
            await agent.handleInput(test_messages)
            
            # Verify conversation ID hasn't changed
            assert agent.conversation_id == original_id 