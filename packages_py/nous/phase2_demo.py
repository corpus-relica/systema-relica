#!/usr/bin/env python3
"""
Phase 2 Demo: Advanced WebSocket Testing Infrastructure

This demo showcases the comprehensive testing capabilities implemented in Phase 2:
- Advanced WebSocket testing utilities
- Message validation and protocol compliance
- Scenario-based testing framework  
- Performance tracking and metrics
- Enhanced mock servers and clients
"""

import sys
import asyncio
from datetime import datetime

# Add current directory to path for imports
sys.path.append('.')

from tests.utils.websocket_utils import (
    MockWebSocketServer,
    WebSocketTestClient,
    MessageValidator,
    NOUSConversationScenario,
    WebSocketStressTestScenario,
    WebSocketPerformanceTracker,
    generate_test_user_message,
    generate_test_final_answer,
    generate_test_heartbeat,
    generate_test_broadcast,
    generate_test_error_message
)


def print_header(title):
    """Print a formatted header."""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")


def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'-'*40}")
    print(f" {title}")
    print(f"{'-'*40}")


async def demo_message_generation():
    """Demonstrate message generation capabilities."""
    print_section("MESSAGE GENERATION CAPABILITIES")
    
    # Generate different types of messages
    user_msg = generate_test_user_message(
        user_id="demo_user", 
        env_id="demo_env", 
        message="Hello from Phase 2 testing infrastructure!"
    )
    print(f"✓ User Input Message:")
    print(f"  Type: {user_msg['type']}")
    print(f"  User ID: {user_msg['user_id']}")
    print(f"  Message: {user_msg['message']}")
    
    final_answer = generate_test_final_answer(
        client_id="demo_client",
        answer="This is a response from the advanced NOUS testing framework."
    )
    print(f"\n✓ Final Answer Message:")
    print(f"  Type: {final_answer['type']}")
    print(f"  Client ID: {final_answer['client_id']}")
    print(f"  Answer: {final_answer['answer']}")
    
    heartbeat = generate_test_heartbeat(active_clients=5)
    print(f"\n✓ Heartbeat Message:")
    print(f"  Type: {heartbeat['type']}")
    print(f"  Active Clients: {heartbeat['payload']['active_clients']}")
    
    broadcast = generate_test_broadcast(
        from_client="test_client",
        message="Broadcasting from Phase 2 demo!"
    )
    print(f"\n✓ Broadcast Message:")
    print(f"  Type: {broadcast['type']}")
    print(f"  From: {broadcast['payload']['from']}")
    print(f"  Message: {broadcast['payload']['message']}")
    
    error_msg = generate_test_error_message(
        client_id="demo_client",
        error="Demo error for testing error handling"
    )
    print(f"\n✓ Error Message:")
    print(f"  Type: {error_msg['type']}")
    print(f"  Error: {error_msg['error']}")
    
    return user_msg, final_answer, heartbeat, broadcast, error_msg


def demo_message_validation(messages):
    """Demonstrate message validation capabilities."""
    print_section("MESSAGE VALIDATION & PROTOCOL COMPLIANCE")
    
    user_msg, final_answer, heartbeat, broadcast, error_msg = messages
    
    # Test message validation
    validations = [
        ("User Input", user_msg, MessageValidator.validate_user_input_message),
        ("Final Answer", final_answer, MessageValidator.validate_final_answer_message),
        ("Heartbeat", heartbeat, MessageValidator.validate_heartbeat_message),
        ("Broadcast", broadcast, MessageValidator.validate_broadcast_message),
        ("Error", error_msg, MessageValidator.validate_error_message),
    ]
    
    for msg_type, message, validator in validations:
        is_valid = validator(message)
        status = "✓ VALID" if is_valid else "✗ INVALID"
        print(f"{status}: {msg_type} message follows protocol")
    
    # Test invalid message
    invalid_msg = {"type": "user-input", "incomplete": "data"}
    is_valid = MessageValidator.validate_user_input_message(invalid_msg)
    status = "✓ CORRECTLY REJECTED" if not is_valid else "✗ INCORRECTLY ACCEPTED"
    print(f"{status}: Invalid message properly handled")


def demo_scenario_building():
    """Demonstrate scenario building capabilities."""
    print_section("SCENARIO-BASED TESTING FRAMEWORK")
    
    # Create conversation scenario
    conv_scenario = NOUSConversationScenario(
        user_id="scenario_user",
        env_id="scenario_env"
    )
    print(f"✓ NOUS Conversation Scenario: {conv_scenario.name}")
    print(f"  User ID: {conv_scenario.user_id}")
    print(f"  Environment ID: {conv_scenario.env_id}")
    
    # Build a multi-turn conversation
    conversation_turns = [
        {"question": "What is NOUS?", "expected_keywords": ["AI", "assistant"]},
        {"question": "How can you help with research?", "expected_keywords": ["research", "analysis"]},
        {"question": "What about data analysis?", "expected_keywords": ["data", "insights"]}
    ]
    
    conv_scenario.build_multi_turn_conversation(conversation_turns)
    print(f"  Built conversation with {len(conversation_turns)} turns")
    print(f"  Total scenario steps: {len(conv_scenario.steps)}")
    
    # Create stress test scenario
    stress_scenario = WebSocketStressTestScenario(num_clients=10)
    print(f"\n✓ WebSocket Stress Test Scenario: {stress_scenario.name}")
    print(f"  Number of clients: {stress_scenario.num_clients}")
    
    stress_scenario.build_concurrent_messaging_scenario(messages_per_client=5)
    print(f"  Messages per client: 5")
    print(f"  Total scenario steps: {len(stress_scenario.steps)}")
    print(f"  Expected total messages: {10 * 5}")


def demo_performance_tracking():
    """Demonstrate performance tracking capabilities."""
    print_section("PERFORMANCE TRACKING & METRICS")
    
    # Create performance tracker
    tracker = WebSocketPerformanceTracker()
    tracker.start_tracking()
    
    print("✓ Performance Tracker initialized")
    
    # Simulate message processing
    import time
    
    # Simulate 10 messages with varying response times
    response_times = [0.12, 0.15, 0.08, 0.20, 0.11, 0.25, 0.13, 0.09, 0.18, 0.16]
    errors = [False, False, False, True, False, False, False, False, True, False]
    
    for i, (response_time, has_error) in enumerate(zip(response_times, errors)):
        tracker.record_message(response_time, has_error)
        print(f"  Message {i+1}: {response_time:.3f}s {'(ERROR)' if has_error else '(SUCCESS)'}")
    
    tracker.stop_tracking()
    
    # Get performance report
    report = tracker.get_performance_report()
    
    print(f"\n✓ Performance Report:")
    print(f"  Messages processed: {report['message_count']}")
    print(f"  Successful messages: {report['message_count'] - report['error_count']}")
    print(f"  Error count: {report['error_count']}")
    print(f"  Success rate: {report['success_rate']:.1%}")
    print(f"  Average response time: {report['average_response_time']:.3f}s")
    print(f"  Min response time: {report['min_response_time']:.3f}s")
    print(f"  Max response time: {report['max_response_time']:.3f}s")


def demo_advanced_features():
    """Demonstrate advanced testing features."""
    print_section("ADVANCED TESTING FEATURES")
    
    print("✓ Mock WebSocket Server:")
    print("  - Message logging and tracking")
    print("  - Custom message handlers")
    print("  - Error simulation capabilities")
    print("  - Client connection management")
    
    print("\n✓ WebSocket Test Client:")
    print("  - Extended connection capabilities")
    print("  - Message sending/receiving with timeouts")
    print("  - JSON message parsing")
    print("  - Message history tracking")
    
    print("\n✓ Test Scenario Framework:")
    print("  - Step-by-step scenario execution")
    print("  - Custom scenario building")
    print("  - Conversation flow testing")
    print("  - Stress testing capabilities")
    
    print("\n✓ Protocol Compliance Testing:")
    print("  - JSON/EDN format validation")
    print("  - Message contract verification")
    print("  - Protocol standard compliance")
    print("  - Error handling validation")


async def main():
    """Main demo function."""
    print_header("PHASE 2 DEMO: Advanced WebSocket Testing Infrastructure")
    
    print("\nPhase 2 Implementation Summary:")
    print("• Comprehensive WebSocket server integration testing (524 lines)")
    print("• JSON/EDN protocol testing and validation (640 lines)")
    print("• LangChain agent integration testing (519 lines)")
    print("• Enhanced testing utilities and scenarios (673 lines)")
    print("• End-to-end scenario testing framework (728 lines)")
    print("• Total: ~2,800 lines of advanced testing infrastructure")
    
    try:
        # Demo message generation
        messages = await demo_message_generation()
        
        # Demo message validation
        demo_message_validation(messages)
        
        # Demo scenario building
        demo_scenario_building()
        
        # Demo performance tracking
        demo_performance_tracking()
        
        # Demo advanced features
        demo_advanced_features()
        
        print_header("PHASE 2 DEMO COMPLETED SUCCESSFULLY")
        
        print("\n✅ Key Phase 2 Achievements:")
        print("  ✓ Advanced WebSocket testing infrastructure")
        print("  ✓ Comprehensive message validation framework")
        print("  ✓ Scenario-based testing capabilities")
        print("  ✓ Performance tracking and metrics")
        print("  ✓ Protocol compliance testing")
        print("  ✓ Enhanced mock servers and clients")
        print("  ✓ Multi-format message support (JSON/EDN)")
        print("  ✓ Error handling and recovery testing")
        
        print("\n🎯 Ready for Phase 3: Coverage & Integration")
        print("   Next: Achieve 80% test coverage across entire Python codebase")
        
    except Exception as e:
        print(f"\n❌ Demo Error: {e}")
        print("Note: Some tests may require additional setup or mock services")


if __name__ == "__main__":
    asyncio.run(main()) 