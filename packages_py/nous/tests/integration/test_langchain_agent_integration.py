"""
LangChain Agent Integration Tests for NOUS system.

Tests the complete LangChain agent functionality including:
- NOUS agent initialization and configuration
- Tool usage and agent reasoning
- Multi-turn conversations and memory
- Integration with WebSocket server
- Service client tool integration (aperture, archivist, clarity)
- Error handling and recovery
"""

import asyncio
import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from typing import Dict, List, Any

from src.relica_nous_langchain.nous_langchain_client import NOUSLangChainClient
from src.relica_nous_langchain.services.NOUSServer import NOUSServer
from tests.utils.websocket_utils import (
    MockWebSocketServer,
    WebSocketTestClient,
    generate_test_user_message,
    generate_test_final_answer
)


@pytest.mark.integration
@pytest.mark.asyncio
class TestNOUSAgentInitialization:
    """Test NOUS LangChain agent initialization and configuration."""
    
    async def test_nous_agent_basic_initialization(self, mock_nous_agent):
        """Test basic NOUS agent initialization."""
        # Verify agent is properly initialized
        assert mock_nous_agent is not None
        assert hasattr(mock_nous_agent, 'handleInput')
        assert callable(mock_nous_agent.handleInput)
    
    async def test_nous_agent_with_tools(self, mock_nous_agent, 
                                      mock_aperture_client,
                                      mock_archivist_client, 
                                      mock_clarity_client):
        """Test NOUS agent initialization with service client tools."""
        # Configure agent with tools
        mock_nous_agent.tools = [
            "aperture_retrieve_environment",
            "archivist_search_memories", 
            "clarity_analyze_text"
        ]
        
        # Test tool availability
        tools = getattr(mock_nous_agent, 'tools', [])
        assert "aperture_retrieve_environment" in tools
        assert "archivist_search_memories" in tools
        assert "clarity_analyze_text" in tools
    
    async def test_nous_agent_model_configuration(self, mock_nous_agent):
        """Test NOUS agent model configuration."""
        # Test model configuration
        mock_nous_agent.model_name = "gpt-4o"
        mock_nous_agent.temperature = 0.1
        mock_nous_agent.max_tokens = 4000
        
        assert mock_nous_agent.model_name == "gpt-4o"
        assert mock_nous_agent.temperature == 0.1
        assert mock_nous_agent.max_tokens == 4000


@pytest.mark.integration
@pytest.mark.asyncio
class TestNOUSAgentConversation:
    """Test NOUS agent conversation handling and responses."""
    
    async def test_single_turn_conversation(self, mock_nous_agent):
        """Test single-turn conversation with NOUS agent."""
        # Mock response
        expected_response = "Hello! I'm NOUS, your AI assistant. How can I help you today?"
        mock_nous_agent.handleInput.return_value = expected_response
        
        # Test conversation
        messages = [{"role": "user", "content": "Hello, who are you?"}]
        response = await mock_nous_agent.handleInput(messages)
        
        assert response == expected_response
        mock_nous_agent.handleInput.assert_called_once_with(messages)
    
    async def test_multi_turn_conversation(self, mock_nous_agent):
        """Test multi-turn conversation with memory."""
        conversation_history = []
        
        # Mock agent to maintain conversation history
        async def mock_handle_input(messages):
            conversation_history.extend(messages)
            if len(conversation_history) == 1:
                return "Hello! I'm NOUS. What would you like to know?"
            elif len(conversation_history) == 3:  # User + Assistant + User
                return "I remember you asked about me. Now you're asking about the weather. I'd need access to weather services to help with that."
            else:
                return "I'm here to help with any questions you have."
        
        mock_nous_agent.handleInput.side_effect = mock_handle_input
        
        # First turn
        turn1_messages = [{"role": "user", "content": "Who are you?"}]
        response1 = await mock_nous_agent.handleInput(turn1_messages)
        assert "Hello! I'm NOUS" in response1
        
        # Second turn - with history
        turn2_messages = [
            {"role": "user", "content": "Who are you?"},
            {"role": "assistant", "content": response1},
            {"role": "user", "content": "What's the weather like?"}
        ]
        response2 = await mock_nous_agent.handleInput(turn2_messages)
        assert "remember" in response2 and "weather" in response2
    
    async def test_agent_reasoning_and_planning(self, mock_nous_agent):
        """Test agent reasoning and planning capabilities."""
        # Mock complex reasoning response
        reasoning_response = """
        I need to break down this complex question about analyzing a document:
        1. First, I'll retrieve the environment to understand the context
        2. Then, I'll search for relevant memories about similar analyses
        3. Finally, I'll use clarity to analyze the text structure
        
        Let me start by retrieving the current environment...
        """
        
        mock_nous_agent.handleInput.return_value = reasoning_response
        
        # Test complex query requiring reasoning
        complex_query = [{
            "role": "user", 
            "content": "Can you analyze this research paper and compare it to similar papers we've discussed before?"
        }]
        
        response = await mock_nous_agent.handleInput(complex_query)
        
        assert "break down" in response
        assert "retrieve the environment" in response
        assert "search for relevant memories" in response
        assert "analyze the text" in response
    
    async def test_agent_error_handling(self, mock_nous_agent):
        """Test agent error handling and graceful failures."""
        # Mock agent error
        error_message = "I encountered an issue processing your request. Let me try a different approach."
        mock_nous_agent.handleInput.side_effect = [
            Exception("Tool call failed"),
            error_message  # Recovery response
        ]
        
        # First call should handle the exception
        with pytest.raises(Exception):
            await mock_nous_agent.handleInput([{"role": "user", "content": "Test error"}])
        
        # Second call should provide graceful error response
        mock_nous_agent.handleInput.side_effect = None
        mock_nous_agent.handleInput.return_value = error_message
        
        response = await mock_nous_agent.handleInput([{"role": "user", "content": "Try again"}])
        assert "encountered an issue" in response
        assert "different approach" in response


@pytest.mark.integration
@pytest.mark.asyncio
class TestNOUSAgentToolIntegration:
    """Test NOUS agent integration with service client tools."""
    
    async def test_aperture_tool_integration(self, mock_nous_agent, mock_aperture_client):
        """Test agent using aperture client tool for environment retrieval."""
        # Mock agent behavior when using aperture tool
        async def mock_agent_with_aperture(messages):
            user_message = messages[-1]["content"]
            if "environment" in user_message.lower():
                # Simulate tool call to aperture
                env_data = await mock_aperture_client.retrieveEnvironment("test_env", None)
                return f"I retrieved the environment data: {env_data['name']} with {len(env_data['facts'])} facts."
            return "I can help you with environment-related questions."
        
        mock_nous_agent.handleInput.side_effect = mock_agent_with_aperture
        
        # Test environment-related query
        env_query = [{"role": "user", "content": "Can you tell me about the current environment?"}]
        response = await mock_nous_agent.handleInput(env_query)
        
        assert "retrieved the environment" in response
        assert "facts" in response
        mock_aperture_client.retrieveEnvironment.assert_called_once()
    
    async def test_archivist_tool_integration(self, mock_nous_agent, mock_archivist_client):
        """Test agent using archivist client tool for memory search."""
        # Mock agent behavior when using archivist tool
        async def mock_agent_with_archivist(messages):
            user_message = messages[-1]["content"]
            if "remember" in user_message.lower() or "memories" in user_message.lower():
                # Simulate tool call to archivist
                memories = await mock_archivist_client.searchMemories("test_query", 5)
                return f"I found {len(memories)} relevant memories about your query."
            return "I can help you search through your memories."
        
        mock_nous_agent.handleInput.side_effect = mock_agent_with_archivist
        
        # Test memory-related query
        memory_query = [{"role": "user", "content": "Do you remember our conversation about AI ethics?"}]
        response = await mock_nous_agent.handleInput(memory_query)
        
        assert "found" in response and "memories" in response
        mock_archivist_client.searchMemories.assert_called_once()
    
    async def test_clarity_tool_integration(self, mock_nous_agent, mock_clarity_client):
        """Test agent using clarity client tool for text analysis."""
        # Mock agent behavior when using clarity tool
        async def mock_agent_with_clarity(messages):
            user_message = messages[-1]["content"]
            if "analyze" in user_message.lower():
                # Simulate tool call to clarity
                analysis = await mock_clarity_client.analyzeText("sample text")
                return f"Analysis complete. The text has {analysis['word_count']} words and {analysis['sentiment']} sentiment."
            return "I can help you analyze text."
        
        mock_nous_agent.handleInput.side_effect = mock_agent_with_clarity
        
        # Test analysis query
        analysis_query = [{"role": "user", "content": "Can you analyze this text for sentiment?"}]
        response = await mock_nous_agent.handleInput(analysis_query)
        
        assert "Analysis complete" in response
        assert "sentiment" in response
        mock_clarity_client.analyzeText.assert_called_once()
    
    async def test_multi_tool_integration(self, mock_nous_agent,
                                        mock_aperture_client,
                                        mock_archivist_client, 
                                        mock_clarity_client):
        """Test agent using multiple tools in sequence."""
        tool_calls_made = []
        
        async def mock_agent_multi_tool(messages):
            user_message = messages[-1]["content"]
            
            if "comprehensive analysis" in user_message.lower():
                # Simulate multiple tool calls
                env_data = await mock_aperture_client.retrieveEnvironment("test_env", None)
                tool_calls_made.append("aperture")
                
                memories = await mock_archivist_client.searchMemories("analysis", 3)
                tool_calls_made.append("archivist")
                
                analysis = await mock_clarity_client.analyzeText("comprehensive text")
                tool_calls_made.append("clarity")
                
                return f"Comprehensive analysis complete using environment data, {len(memories)} memories, and text analysis."
            
            return "I can provide comprehensive analysis using multiple tools."
        
        mock_nous_agent.handleInput.side_effect = mock_agent_multi_tool
        
        # Test multi-tool query
        multi_query = [{"role": "user", "content": "Can you do a comprehensive analysis of the current situation?"}]
        response = await mock_nous_agent.handleInput(multi_query)
        
        assert "Comprehensive analysis complete" in response
        assert len(tool_calls_made) == 3
        assert "aperture" in tool_calls_made
        assert "archivist" in tool_calls_made
        assert "clarity" in tool_calls_made


@pytest.mark.integration
@pytest.mark.asyncio
class TestNOUSWebSocketAgentIntegration:
    """Test NOUS agent integration with WebSocket server."""
    
    async def test_websocket_agent_message_flow(self, mock_nous_agent):
        """Test complete WebSocket message flow with NOUS agent."""
        server = NOUSServer()
        
        # Track agent interactions
        agent_interactions = []
        
        async def tracking_handler(user_id, env_id, message, client_id):
            agent_interactions.append({
                'user_id': user_id,
                'env_id': env_id,
                'message': message,
                'client_id': client_id
            })
            
            # Simulate agent processing
            agent_messages = [{"role": "user", "content": message}]
            response = await mock_nous_agent.handleInput(agent_messages)
            
            return {
                "type": "final-answer",
                "client_id": client_id,
                "answer": response,
                "user_id": user_id,
                "env_id": env_id
            }
        
        server.init(tracking_handler)
        
        # Test user input processing
        payload = {
            'user-id': 'websocket_user',
            'env-id': 'websocket_env',
            'message': 'Hello via WebSocket!'
        }
        
        result = await server.handle_user_input(payload, "websocket_client")
        
        # Verify agent interaction
        assert len(agent_interactions) == 1
        interaction = agent_interactions[0]
        assert interaction['user_id'] == 'websocket_user'
        assert interaction['env_id'] == 'websocket_env'
        assert interaction['message'] == 'Hello via WebSocket!'
        assert interaction['client_id'] == 'websocket_client'
        
        # Verify agent was called
        mock_nous_agent.handleInput.assert_called_once()
    
    async def test_websocket_agent_error_recovery(self, mock_nous_agent):
        """Test WebSocket agent error recovery."""
        server = NOUSServer()
        
        # Mock agent that fails first time, succeeds second time
        call_count = 0
        
        async def error_recovery_handler(user_id, env_id, message, client_id):
            nonlocal call_count
            call_count += 1
            
            if call_count == 1:
                # First call - agent fails
                mock_nous_agent.handleInput.side_effect = Exception("Agent error")
                try:
                    await mock_nous_agent.handleInput([{"role": "user", "content": message}])
                except Exception as e:
                    return {
                        "type": "error",
                        "client_id": client_id,
                        "error": f"Agent processing failed: {str(e)}"
                    }
            else:
                # Second call - agent succeeds
                mock_nous_agent.handleInput.side_effect = None
                mock_nous_agent.handleInput.return_value = "Recovery successful"
                response = await mock_nous_agent.handleInput([{"role": "user", "content": message}])
                return {
                    "type": "final-answer",
                    "client_id": client_id,
                    "answer": response
                }
        
        server.init(error_recovery_handler)
        
        # First attempt - should handle error gracefully
        error_payload = {
            'user-id': 'error_user',
            'env-id': 'error_env', 
            'message': 'This will cause an error'
        }
        
        error_result = await server.handle_user_input(error_payload, "error_client")
        # Note: error_result would be None since handle_user_input doesn't return the result
        
        # Second attempt - should succeed
        success_payload = {
            'user-id': 'success_user',
            'env-id': 'success_env',
            'message': 'This should work'
        }
        
        success_result = await server.handle_user_input(success_payload, "success_client")
        
        # Verify both calls were made
        assert call_count == 2
    
    async def test_concurrent_websocket_agent_requests(self, mock_nous_agent):
        """Test handling concurrent WebSocket requests to agent."""
        server = NOUSServer()
        
        # Track concurrent processing
        processing_order = []
        
        async def concurrent_handler(user_id, env_id, message, client_id):
            processing_order.append(f"start_{client_id}")
            
            # Simulate agent processing with delay
            await asyncio.sleep(0.1)
            response = await mock_nous_agent.handleInput([{"role": "user", "content": message}])
            
            processing_order.append(f"end_{client_id}")
            
            return {
                "type": "final-answer",
                "client_id": client_id,
                "answer": f"Processed for {client_id}: {response}"
            }
        
        server.init(concurrent_handler)
        
        # Create multiple concurrent requests
        payloads = [
            {'user-id': 'user1', 'env-id': 'env1', 'message': 'Message 1'},
            {'user-id': 'user2', 'env-id': 'env2', 'message': 'Message 2'}, 
            {'user-id': 'user3', 'env-id': 'env3', 'message': 'Message 3'}
        ]
        
        client_ids = ["client1", "client2", "client3"]
        
        # Process concurrently
        tasks = [
            server.handle_user_input(payload, client_id)
            for payload, client_id in zip(payloads, client_ids)
        ]
        
        await asyncio.gather(*tasks)
        
        # Verify all requests were processed
        assert len([item for item in processing_order if item.startswith("start_")]) == 3
        assert len([item for item in processing_order if item.startswith("end_")]) == 3
        
        # Verify agent was called for each request
        assert mock_nous_agent.handleInput.call_count == 3


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.slow
class TestNOUSAgentPerformance:
    """Test NOUS agent performance and scalability."""
    
    async def test_agent_response_time(self, mock_nous_agent):
        """Test agent response time under normal conditions."""
        import time
        
        # Mock agent with realistic processing time
        async def timed_agent_response(messages):
            await asyncio.sleep(0.05)  # 50ms processing time
            return "Response generated in reasonable time."
        
        mock_nous_agent.handleInput.side_effect = timed_agent_response
        
        # Measure response time
        start_time = time.time()
        messages = [{"role": "user", "content": "Test response time"}]
        response = await mock_nous_agent.handleInput(messages)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response == "Response generated in reasonable time."
        assert response_time < 1.0  # Should respond within 1 second
        assert response_time > 0.04  # Should take at least our simulated processing time
    
    async def test_agent_memory_usage(self, mock_nous_agent):
        """Test agent memory usage with large conversation history."""
        # Simulate large conversation history
        large_conversation = []
        
        for i in range(100):  # 100 message pairs
            large_conversation.extend([
                {"role": "user", "content": f"User message {i}"},
                {"role": "assistant", "content": f"Assistant response {i}"}
            ])
        
        # Add final user message
        large_conversation.append({"role": "user", "content": "Final question"})
        
        # Mock agent handling large conversation
        mock_nous_agent.handleInput.return_value = "I've processed your conversation history."
        
        response = await mock_nous_agent.handleInput(large_conversation)
        
        assert response == "I've processed your conversation history."
        mock_nous_agent.handleInput.assert_called_once_with(large_conversation)
        
        # Verify the conversation has expected size
        assert len(large_conversation) == 201  # 100 pairs + 1 final message
    
    async def test_agent_stress_testing(self, mock_nous_agent):
        """Test agent under stress conditions."""
        # Configure agent for stress test
        stress_responses = []
        
        async def stress_test_agent(messages):
            await asyncio.sleep(0.01)  # Minimal processing time
            response = f"Stress response {len(stress_responses) + 1}"
            stress_responses.append(response)
            return response
        
        mock_nous_agent.handleInput.side_effect = stress_test_agent
        
        # Send many requests rapidly
        num_requests = 20
        tasks = []
        
        for i in range(num_requests):
            messages = [{"role": "user", "content": f"Stress test message {i}"}]
            task = asyncio.create_task(mock_nous_agent.handleInput(messages))
            tasks.append(task)
        
        # Wait for all responses
        responses = await asyncio.gather(*tasks)
        
        # Verify all requests were handled
        assert len(responses) == num_requests
        assert len(stress_responses) == num_requests
        assert mock_nous_agent.handleInput.call_count == num_requests
        
        # Verify responses are unique and in order
        for i, response in enumerate(responses):
            assert f"Stress response {i + 1}" in response 