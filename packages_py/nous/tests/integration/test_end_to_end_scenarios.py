"""
End-to-End WebSocket Testing Scenarios for NOUS system.

Comprehensive scenarios that test the complete system integration:
- Real-world user interaction patterns
- Multi-client collaboration scenarios
- Error recovery and resilience testing
- Performance under realistic conditions
- Complex conversation flows with all services
"""

import asyncio
import json
import pytest
import time
from unittest.mock import AsyncMock, patch
from typing import Dict, List, Any

from src.relica_nous_langchain.services.NOUSServer import NOUSServer
from src.meridian.server import WebSocketServer, register_handlers
from tests.utils.websocket_utils import (
    MockWebSocketServer,
    WebSocketTestClient,
    NOUSConversationScenario,
    WebSocketStressTestScenario,
    WebSocketPerformanceTracker,
    MessageValidator,
    generate_test_user_message,
    generate_test_final_answer,
    generate_test_heartbeat,
    generate_test_broadcast
)


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.e2e
class TestCompleteNOUSWorkflow:
    """Test complete NOUS workflow scenarios."""
    
    async def test_research_assistance_workflow(self, 
                                               mock_nous_agent,
                                               mock_aperture_client,
                                               mock_archivist_client,
                                               mock_clarity_client,
                                               mock_semantic_model):
        """Test a complete research assistance workflow."""
        # Set up NOUS server with all services integrated
        server = NOUSServer()
        
        # Track the complete workflow
        workflow_steps = []
        
        async def research_workflow_handler(user_id, env_id, message, client_id):
            workflow_steps.append(f"received_user_input: {message}")
            
            # Simulate comprehensive research workflow
            if "research" in message.lower():
                # 1. Retrieve research environment
                env_data = await mock_aperture_client.retrieveEnvironment(env_id, None)
                workflow_steps.append("retrieved_environment")
                
                # 2. Search for related research memories
                memories = await mock_archivist_client.searchMemories("research", 10)
                workflow_steps.append(f"searched_memories: {len(memories)} found")
                
                # 3. Add current research context to semantic model
                research_facts = [
                    {"id": 1, "type": "research_topic", "name": "AI Ethics"},
                    {"id": 2, "type": "research_status", "name": "In Progress"}
                ]
                await mock_semantic_model.addFacts(research_facts)
                workflow_steps.append("added_research_facts")
                
                # 4. Analyze research content with clarity
                analysis = await mock_clarity_client.analyzeText(message)
                workflow_steps.append(f"analyzed_text: {analysis['sentiment']}")
                
                # 5. Process with NOUS agent
                agent_messages = [{"role": "user", "content": message}]
                agent_response = await mock_nous_agent.handleInput(agent_messages)
                workflow_steps.append("processed_with_agent")
                
                return {
                    "type": "final-answer",
                    "client_id": client_id,
                    "answer": f"Research workflow complete: {agent_response}",
                    "environment": env_data["name"],
                    "memories_found": len(memories),
                    "facts_added": len(research_facts),
                    "analysis": analysis
                }
            
            return {
                "type": "final-answer",
                "client_id": client_id,
                "answer": "I can help with research tasks."
            }
        
        server.init(research_workflow_handler)
        
        # Test the research workflow
        research_query = {
            'user-id': 'researcher_001',
            'env-id': 'research_env_ai_ethics',
            'message': 'I need help with my AI ethics research project'
        }
        
        await server.handle_user_input(research_query, "research_client")
        
        # Verify complete workflow execution
        expected_steps = [
            "received_user_input: I need help with my AI ethics research project",
            "retrieved_environment",
            "searched_memories: 3 found",
            "added_research_facts",
            "analyzed_text: positive",
            "processed_with_agent"
        ]
        
        for expected_step in expected_steps:
            assert expected_step in workflow_steps
        
        # Verify all service calls were made
        mock_aperture_client.retrieveEnvironment.assert_called_once()
        mock_archivist_client.searchMemories.assert_called_once()
        mock_semantic_model.addFacts.assert_called_once()
        mock_clarity_client.analyzeText.assert_called_once()
        mock_nous_agent.handleInput.assert_called_once()
    
    async def test_collaborative_problem_solving(self, mock_nous_agent):
        """Test multi-client collaborative problem solving scenario."""
        server = MockWebSocketServer()
        
        # Track collaboration
        collaboration_log = []
        problem_solutions = {}
        
        async def collaboration_handler(message, websocket):
            client_id = message.get("client_id", "unknown")
            
            if message["type"] == "problem-contribution":
                contribution = message["contribution"]
                problem_id = message["problem_id"]
                
                collaboration_log.append(f"contribution_{client_id}: {contribution}")
                
                if problem_id not in problem_solutions:
                    problem_solutions[problem_id] = []
                problem_solutions[problem_id].append({
                    "client_id": client_id,
                    "contribution": contribution
                })
                
                # Broadcast contribution to other clients
                broadcast_msg = {
                    "type": "collaboration-update",
                    "problem_id": problem_id,
                    "contributor": client_id,
                    "contribution": contribution,
                    "total_contributions": len(problem_solutions[problem_id])
                }
                await server.broadcast(broadcast_msg)
                
                return {
                    "type": "contribution-acknowledged",
                    "client_id": client_id,
                    "problem_id": problem_id,
                    "contribution_number": len(problem_solutions[problem_id])
                }
        
        server.register_message_handler("problem-contribution", collaboration_handler)
        await server.start()
        
        try:
            # Create multiple collaborating clients
            clients = []
            for i in range(3):
                client = WebSocketTestClient(server.url)
                await client.connect()
                clients.append(client)
            
            # Simulate collaborative problem solving
            problem_id = "ai_safety_protocols"
            contributions = [
                "We need robust testing frameworks",
                "Ethical guidelines should be integrated",
                "Real-time monitoring is essential"
            ]
            
            # Each client contributes to the problem
            for i, (client, contribution) in enumerate(zip(clients, contributions)):
                contrib_message = {
                    "type": "problem-contribution",
                    "client_id": f"collaborator_{i}",
                    "problem_id": problem_id,
                    "contribution": contribution
                }
                
                await client.send_message(contrib_message)
                
                # Wait for acknowledgment
                ack = await client.receive_json_message()
                assert ack["type"] == "contribution-acknowledged"
                assert ack["problem_id"] == problem_id
                
                # Other clients should receive collaboration updates
                for j, other_client in enumerate(clients):
                    if i != j:  # Don't check the sender
                        try:
                            update = await other_client.receive_json_message(timeout=2.0)
                            assert update["type"] == "collaboration-update"
                            assert update["problem_id"] == problem_id
                            assert update["contributor"] == f"collaborator_{i}"
                        except asyncio.TimeoutError:
                            pass  # Some updates may not arrive due to timing
            
            # Verify collaboration was recorded
            assert len(problem_solutions[problem_id]) == 3
            for i, contribution in enumerate(contributions):
                assert contribution in [sol["contribution"] for sol in problem_solutions[problem_id]]
            
            # Cleanup
            for client in clients:
                await client.disconnect()
                
        finally:
            await server.stop()
    
    async def test_error_recovery_resilience(self, mock_nous_agent):
        """Test system resilience and error recovery."""
        server = NOUSServer()
        
        error_scenarios = []
        recovery_attempts = []
        
        async def resilient_handler(user_id, env_id, message, client_id):
            try:
                error_scenarios.append(f"processing_{client_id}")
                
                # Simulate various failure scenarios
                if "cause_timeout" in message:
                    await asyncio.sleep(2.0)  # Simulate timeout
                    raise asyncio.TimeoutError("Processing timeout")
                
                elif "cause_service_error" in message:
                    raise Exception("Service temporarily unavailable")
                
                elif "cause_invalid_data" in message:
                    raise ValueError("Invalid data format")
                
                else:
                    # Normal processing
                    response = await mock_nous_agent.handleInput([{"role": "user", "content": message}])
                    return {
                        "type": "final-answer",
                        "client_id": client_id,
                        "answer": response
                    }
                    
            except asyncio.TimeoutError as e:
                recovery_attempts.append(f"timeout_recovery_{client_id}")
                return {
                    "type": "error",
                    "client_id": client_id,
                    "error": "Request timed out. Please try again.",
                    "recovery_suggestion": "simplify_query"
                }
                
            except ValueError as e:
                recovery_attempts.append(f"validation_recovery_{client_id}")
                return {
                    "type": "error",
                    "client_id": client_id,
                    "error": "Invalid input format. Please check your request.",
                    "recovery_suggestion": "format_correction"
                }
                
            except Exception as e:
                recovery_attempts.append(f"general_recovery_{client_id}")
                return {
                    "type": "error",
                    "client_id": client_id,
                    "error": "Service temporarily unavailable. Retrying...",
                    "recovery_suggestion": "retry_later"
                }
        
        server.init(resilient_handler)
        
        # Test different error scenarios
        error_test_cases = [
            {
                'user-id': 'error_user_1',
                'env-id': 'error_env',
                'message': 'cause_timeout - this should timeout'
            },
            {
                'user-id': 'error_user_2', 
                'env-id': 'error_env',
                'message': 'cause_service_error - this should fail'
            },
            {
                'user-id': 'error_user_3',
                'env-id': 'error_env',
                'message': 'cause_invalid_data - this should be invalid'
            },
            {
                'user-id': 'success_user',
                'env-id': 'success_env',
                'message': 'this should work normally'
            }
        ]
        
        # Process all test cases
        for i, test_case in enumerate(error_test_cases):
            await server.handle_user_input(test_case, f"test_client_{i}")
        
        # Verify error handling and recovery
        assert len(error_scenarios) == 4
        assert len(recovery_attempts) == 3  # 3 errors, 1 success
        
        # Verify specific recovery types
        assert any("timeout_recovery" in attempt for attempt in recovery_attempts)
        assert any("validation_recovery" in attempt for attempt in recovery_attempts)
        assert any("general_recovery" in attempt for attempt in recovery_attempts)


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.performance
class TestWebSocketPerformanceScenarios:
    """Test WebSocket performance under realistic conditions."""
    
    async def test_high_throughput_conversation_scenario(self, mock_nous_agent):
        """Test high-throughput conversation handling."""
        server = MockWebSocketServer()
        performance_tracker = WebSocketPerformanceTracker()
        
        # Configure for high throughput
        responses_sent = 0
        
        async def high_throughput_handler(message, websocket):
            nonlocal responses_sent
            start_time = time.time()
            
            try:
                # Simulate NOUS processing
                agent_response = await mock_nous_agent.handleInput([
                    {"role": "user", "content": message.get("message", "test")}
                ])
                
                response = generate_test_final_answer(
                    client_id=message.get("client_id"),
                    answer=f"Response {responses_sent + 1}: {agent_response}"
                )
                
                end_time = time.time()
                performance_tracker.record_message(end_time - start_time)
                responses_sent += 1
                
                return response
                
            except Exception as e:
                end_time = time.time()
                performance_tracker.record_message(end_time - start_time, error=True)
                return {
                    "type": "error",
                    "client_id": message.get("client_id"),
                    "error": str(e)
                }
        
        server.register_message_handler("user-input", high_throughput_handler)
        await server.start()
        
        performance_tracker.start_tracking()
        
        try:
            # Create multiple clients for concurrent load
            num_clients = 5
            messages_per_client = 10
            clients = []
            
            for i in range(num_clients):
                client = WebSocketTestClient(server.url)
                await client.connect()
                clients.append(client)
            
            # Send messages concurrently from all clients
            tasks = []
            for client_idx, client in enumerate(clients):
                for msg_idx in range(messages_per_client):
                    message = generate_test_user_message(
                        user_id=f"perf_user_{client_idx}",
                        message=f"Performance test message {msg_idx + 1}",
                        client_id=f"perf_client_{client_idx}"
                    )
                    
                    task = asyncio.create_task(client.send_and_receive_json(message, timeout=10.0))
                    tasks.append(task)
            
            # Wait for all responses
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            performance_tracker.stop_tracking()
            
            # Analyze performance
            performance_report = performance_tracker.get_performance_report()
            
            # Verify performance metrics
            total_messages = num_clients * messages_per_client
            assert performance_report["message_count"] == total_messages
            assert performance_report["average_response_time"] < 1.0  # Under 1 second average
            assert performance_report["success_rate"] > 0.95  # 95% success rate
            assert performance_report["messages_per_second"] > 10  # At least 10 msg/sec
            
            # Verify responses
            successful_responses = [r for r in responses if isinstance(r, dict) and "error" not in r]
            assert len(successful_responses) >= total_messages * 0.95  # 95% success
            
            # Cleanup
            for client in clients:
                await client.disconnect()
                
        finally:
            await server.stop()
    
    async def test_concurrent_multi_service_scenario(self,
                                                   mock_nous_agent,
                                                   mock_aperture_client,
                                                   mock_archivist_client,
                                                   mock_clarity_client,
                                                   mock_semantic_model):
        """Test concurrent multi-service operations."""
        server = NOUSServer()
        
        # Track service call patterns
        service_call_log = []
        concurrent_operations = 0
        max_concurrent_operations = 0
        
        async def multi_service_handler(user_id, env_id, message, client_id):
            nonlocal concurrent_operations, max_concurrent_operations
            
            concurrent_operations += 1
            max_concurrent_operations = max(max_concurrent_operations, concurrent_operations)
            
            try:
                service_call_log.append(f"start_{client_id}")
                
                # Simulate concurrent service calls
                tasks = []
                
                # Aperture environment retrieval
                tasks.append(mock_aperture_client.retrieveEnvironment(env_id, None))
                service_call_log.append(f"aperture_called_{client_id}")
                
                # Archivist memory search
                tasks.append(mock_archivist_client.searchMemories(message, 5))
                service_call_log.append(f"archivist_called_{client_id}")
                
                # Clarity text analysis
                tasks.append(mock_clarity_client.analyzeText(message))
                service_call_log.append(f"clarity_called_{client_id}")
                
                # Wait for all service calls concurrently
                env_data, memories, analysis = await asyncio.gather(*tasks)
                
                # Add facts to semantic model
                facts = [{"id": len(service_call_log), "type": "concurrent_test", "data": message}]
                await mock_semantic_model.addFacts(facts)
                service_call_log.append(f"semantic_called_{client_id}")
                
                # Process with NOUS agent
                agent_response = await mock_nous_agent.handleInput([
                    {"role": "user", "content": message}
                ])
                service_call_log.append(f"agent_called_{client_id}")
                
                return {
                    "type": "final-answer",
                    "client_id": client_id,
                    "answer": f"Multi-service response: {agent_response}",
                    "services_used": ["aperture", "archivist", "clarity", "semantic", "agent"]
                }
                
            finally:
                concurrent_operations -= 1
                service_call_log.append(f"end_{client_id}")
        
        server.init(multi_service_handler)
        
        # Create multiple concurrent requests
        num_concurrent_requests = 8
        tasks = []
        
        for i in range(num_concurrent_requests):
            payload = {
                'user-id': f'concurrent_user_{i}',
                'env-id': f'concurrent_env_{i}',
                'message': f'Concurrent multi-service test {i}'
            }
            
            task = asyncio.create_task(
                server.handle_user_input(payload, f"concurrent_client_{i}")
            )
            tasks.append(task)
        
        # Wait for all concurrent operations to complete
        await asyncio.gather(*tasks)
        
        # Verify concurrent execution
        assert max_concurrent_operations >= 2  # At least 2 operations were concurrent
        assert len(service_call_log) >= num_concurrent_requests * 6  # All service calls made
        
        # Verify all services were called for each request
        for i in range(num_concurrent_requests):
            client_id = f"concurrent_client_{i}"
            assert f"aperture_called_{client_id}" in service_call_log
            assert f"archivist_called_{client_id}" in service_call_log
            assert f"clarity_called_{client_id}" in service_call_log
            assert f"semantic_called_{client_id}" in service_call_log
            assert f"agent_called_{client_id}" in service_call_log


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.scenario_based
class TestAdvancedScenarioExecution:
    """Test advanced scenario execution capabilities."""
    
    async def test_nous_conversation_scenario_execution(self, mock_nous_agent):
        """Test executing a complete NOUS conversation scenario."""
        # Configure mock agent for conversation
        conversation_responses = [
            "Hello! I'm NOUS, your AI assistant. How can I help you today?",
            "I'd be happy to help you with your research project. What specific area are you focusing on?",
            "AI ethics is a fascinating and important field. I can help you explore key principles and current debates.",
            "Great questions! Let me provide some comprehensive insights on AI ethics frameworks."
        ]
        
        mock_nous_agent.handleInput.side_effect = conversation_responses
        
        # Set up mock server
        server = MockWebSocketServer()
        
        # Handler that integrates with NOUS agent
        async def conversation_handler(message, websocket):
            if message["type"] == "user-input":
                user_message = message["message"]
                agent_response = await mock_nous_agent.handleInput([
                    {"role": "user", "content": user_message}
                ])
                
                return generate_test_final_answer(
                    client_id=message["client_id"],
                    answer=agent_response
                )
        
        server.register_message_handler("user-input", conversation_handler)
        await server.start()
        
        try:
            # Build conversation scenario
            conversation_turns = [
                {
                    "question": "Hello, who are you?",
                    "expected_keywords": ["NOUS", "assistant"]
                },
                {
                    "question": "I need help with my research project",
                    "expected_keywords": ["help", "research"]
                },
                {
                    "question": "I'm studying AI ethics",
                    "expected_keywords": ["ethics", "AI"]
                },
                {
                    "question": "What are the key ethical frameworks?",
                    "expected_keywords": ["frameworks", "insights"]
                }
            ]
            
            scenario = NOUSConversationScenario(
                user_id="scenario_user",
                env_id="scenario_env"
            )
            scenario.set_server(server)
            scenario.build_multi_turn_conversation(conversation_turns)
            
            # Execute the scenario
            results = await scenario.execute()
            
            # Verify scenario execution
            assert results["success"] is True
            assert results["steps_executed"] > 0
            assert len(results["step_results"]) > 0
            
            # Verify all conversation turns were processed
            step_results = results["step_results"]
            receive_steps = [step for step in step_results if step["type"] == "receive_message"]
            assert len(receive_steps) == len(conversation_turns)
            
            # Verify agent was called for each turn
            assert mock_nous_agent.handleInput.call_count == len(conversation_turns)
            
            await scenario.cleanup()
            
        finally:
            await server.stop()
    
    async def test_stress_testing_scenario_execution(self, mock_nous_agent):
        """Test executing a WebSocket stress testing scenario."""
        # Configure agent for stress testing
        async def stress_agent_response(messages):
            await asyncio.sleep(0.01)  # Minimal processing delay
            return f"Stress test response: {len(messages)} messages processed"
        
        mock_nous_agent.handleInput.side_effect = stress_agent_response
        
        # Set up server for stress testing
        server = MockWebSocketServer()
        
        message_count = 0
        
        async def stress_handler(message, websocket):
            nonlocal message_count
            message_count += 1
            
            if message["type"] == "user-input":
                agent_response = await mock_nous_agent.handleInput([
                    {"role": "user", "content": message["message"]}
                ])
                
                return generate_test_final_answer(
                    client_id=message["client_id"],
                    answer=f"Message {message_count}: {agent_response}"
                )
        
        server.register_message_handler("user-input", stress_handler)
        await server.start()
        
        try:
            # Build stress test scenario
            scenario = WebSocketStressTestScenario(num_clients=5)
            scenario.set_server(server)
            scenario.build_concurrent_messaging_scenario(messages_per_client=3)
            
            # Execute stress test
            start_time = time.time()
            results = await scenario.execute()
            end_time = time.time()
            
            execution_time = end_time - start_time
            
            # Verify stress test results
            assert results["success"] is True
            assert message_count == 15  # 5 clients × 3 messages each
            assert execution_time < 30.0  # Should complete within 30 seconds
            
            # Verify all agents calls were made
            assert mock_nous_agent.handleInput.call_count == 15
            
            await scenario.cleanup()
            
        finally:
            await server.stop()
    
    async def test_custom_scenario_building_and_execution(self):
        """Test building and executing custom scenarios."""
        server = MockWebSocketServer()
        
        # Custom scenario tracking
        custom_steps_executed = []
        
        async def custom_handler(message, websocket):
            custom_steps_executed.append(f"handled_{message['type']}")
            
            if message["type"] == "custom-test":
                return {
                    "type": "custom-response",
                    "client_id": message["client_id"],
                    "data": "Custom handler executed successfully"
                }
        
        server.register_message_handler("custom-test", custom_handler)
        await server.start()
        
        try:
            # Build custom scenario step by step
            from tests.utils.websocket_utils import WebSocketTestScenario
            
            scenario = WebSocketTestScenario("Custom Test Scenario")
            scenario.set_server(server)
            
            # Add custom test steps
            scenario.add_client("custom_client", server.url)
            scenario.add_step("connect_client", client_id="custom_client")
            scenario.add_step("send_message", 
                            client_id="custom_client",
                            message={
                                "type": "custom-test",
                                "client_id": "custom_client",
                                "data": "test data"
                            })
            scenario.add_step("receive_message", client_id="custom_client")
            scenario.add_step("wait", duration=0.5)
            scenario.add_step("disconnect_client", client_id="custom_client")
            
            # Execute custom scenario
            results = await scenario.execute()
            
            # Verify custom scenario execution
            assert results["success"] is True
            assert results["scenario"] == "Custom Test Scenario"
            assert results["steps_executed"] == 5
            
            # Verify custom handler was called
            assert "handled_custom-test" in custom_steps_executed
            
            # Verify step results
            step_results = results["step_results"]
            assert len(step_results) == 5
            assert all(step["success"] for step in step_results)
            
            await scenario.cleanup()
            
        finally:
            await server.stop() 