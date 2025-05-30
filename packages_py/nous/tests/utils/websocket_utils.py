"""
WebSocket testing utilities for NOUS system.

Enhanced utilities for comprehensive WebSocket testing including:
- Advanced mock WebSocket server
- WebSocket test client with extended capabilities
- Message validation and contract testing
- Test scenario generation and execution
- Performance testing utilities
"""

import asyncio
import json
import uuid
import websockets
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable, Union
from unittest.mock import AsyncMock, MagicMock
import pytest


class MockWebSocketServer:
    """Enhanced mock WebSocket server for testing."""
    
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.url = f"ws://{host}:{port}"
        self.server = None
        self.connected_clients = set()
        self.message_handlers = {}
        self.message_log = []
        self.is_running = False
    
    def register_message_handler(self, message_type: str, handler: Callable):
        """Register a message handler for specific message types."""
        self.message_handlers[message_type] = handler
    
    async def handle_client(self, websocket, path):
        """Handle individual client connections."""
        client_id = str(uuid.uuid4())
        self.connected_clients.add(websocket)
        
        try:
            async for message in websocket:
                try:
                    parsed_message = json.loads(message)
                    self.message_log.append({
                        'client_id': client_id,
                        'timestamp': datetime.now().isoformat(),
                        'message': parsed_message
                    })
                    
                    message_type = parsed_message.get('type', 'unknown')
                    
                    if message_type in self.message_handlers:
                        response = await self.message_handlers[message_type](parsed_message, websocket)
                        if response:
                            await websocket.send(json.dumps(response))
                    else:
                        # Default response for unhandled messages
                        error_response = {
                            "type": "error",
                            "client_id": client_id,
                            "error": f"No handler for message type: {message_type}",
                            "original_message": parsed_message
                        }
                        await websocket.send(json.dumps(error_response))
                        
                except json.JSONDecodeError as e:
                    error_response = {
                        "type": "error",
                        "client_id": client_id,
                        "error": f"Invalid JSON: {str(e)}",
                        "original_message": message
                    }
                    await websocket.send(json.dumps(error_response))
                    
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.connected_clients.discard(websocket)
    
    async def start(self):
        """Start the mock WebSocket server."""
        if not self.is_running:
            self.server = await websockets.serve(
                self.handle_client, 
                self.host, 
                self.port
            )
            self.is_running = True
    
    async def stop(self):
        """Stop the mock WebSocket server."""
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            self.is_running = False
    
    async def broadcast(self, message: Dict):
        """Broadcast message to all connected clients."""
        if self.connected_clients:
            message_str = json.dumps(message)
            await asyncio.gather(
                *[client.send(message_str) for client in self.connected_clients],
                return_exceptions=True
            )
    
    def get_message_log(self):
        """Get the complete message log."""
        return self.message_log.copy()
    
    def clear_message_log(self):
        """Clear the message log."""
        self.message_log.clear()


class WebSocketTestClient:
    """Enhanced WebSocket test client."""
    
    def __init__(self, url: str):
        self.url = url
        self.websocket = None
        self.received_messages = []
        self.is_connected = False
    
    async def connect(self, timeout: float = 5.0):
        """Connect to WebSocket server."""
        try:
            self.websocket = await asyncio.wait_for(
                websockets.connect(self.url),
                timeout=timeout
            )
            self.is_connected = True
        except asyncio.TimeoutError:
            raise ConnectionError(f"Failed to connect to {self.url} within {timeout} seconds")
    
    async def disconnect(self):
        """Disconnect from WebSocket server."""
        if self.websocket and self.is_connected:
            await self.websocket.close()
            self.is_connected = False
    
    async def send_message(self, message: Dict):
        """Send a message to the server."""
        if not self.is_connected:
            raise ConnectionError("Not connected to WebSocket server")
        
        message_str = json.dumps(message)
        await self.websocket.send(message_str)
    
    async def receive_message(self, timeout: float = 5.0) -> str:
        """Receive a raw message from the server."""
        if not self.is_connected:
            raise ConnectionError("Not connected to WebSocket server")
        
        try:
            message = await asyncio.wait_for(
                self.websocket.recv(),
                timeout=timeout
            )
            self.received_messages.append(message)
            return message
        except asyncio.TimeoutError:
            raise TimeoutError(f"No message received within {timeout} seconds")
    
    async def receive_json_message(self, timeout: float = 5.0) -> Dict:
        """Receive and parse a JSON message from the server."""
        message_str = await self.receive_message(timeout)
        return json.loads(message_str)
    
    async def send_and_receive(self, message: Dict, timeout: float = 5.0) -> str:
        """Send a message and wait for a response."""
        await self.send_message(message)
        return await self.receive_message(timeout)
    
    async def send_and_receive_json(self, message: Dict, timeout: float = 5.0) -> Dict:
        """Send a message and wait for a JSON response."""
        await self.send_message(message)
        return await self.receive_json_message(timeout)
    
    def get_received_messages(self) -> List[str]:
        """Get all received messages."""
        return self.received_messages.copy()
    
    def clear_received_messages(self):
        """Clear the received messages log."""
        self.received_messages.clear()


class MessageValidator:
    """Enhanced message validation utilities."""
    
    @staticmethod
    def validate_user_input_message(message: Dict) -> bool:
        """Validate user input message format."""
        required_fields = ["type", "user_id", "env_id", "client_id", "message"]
        
        if not isinstance(message, dict):
            return False
        
        # Check required fields
        for field in required_fields:
            if field not in message:
                return False
            if not isinstance(message[field], str) or not message[field].strip():
                return False
        
        # Validate message type
        if message["type"] != "user-input":
            return False
        
        return True
    
    @staticmethod
    def validate_final_answer_message(message: Dict) -> bool:
        """Validate final answer message format."""
        required_fields = ["type", "client_id", "answer"]
        
        if not isinstance(message, dict):
            return False
        
        for field in required_fields:
            if field not in message:
                return False
        
        if message["type"] != "final-answer":
            return False
        
        if not isinstance(message["answer"], str):
            return False
        
        return True
    
    @staticmethod
    def validate_error_message(message: Dict) -> bool:
        """Validate error message format."""
        required_fields = ["type", "client_id", "error"]
        
        if not isinstance(message, dict):
            return False
        
        for field in required_fields:
            if field not in message:
                return False
        
        if message["type"] != "error":
            return False
        
        if not isinstance(message["error"], str):
            return False
        
        return True
    
    @staticmethod
    def validate_heartbeat_message(message: Dict) -> bool:
        """Validate heartbeat message format."""
        if not isinstance(message, dict):
            return False
        
        if message.get("type") != "heartbeat":
            return False
        
        if "payload" not in message:
            return False
        
        payload = message["payload"]
        if not isinstance(payload, dict):
            return False
        
        required_payload_fields = ["server_time", "active_clients"]
        for field in required_payload_fields:
            if field not in payload:
                return False
        
        return True
    
    @staticmethod
    def validate_broadcast_message(message: Dict) -> bool:
        """Validate broadcast message format."""
        if not isinstance(message, dict):
            return False
        
        if message.get("type") != "broadcast":
            return False
        
        if "payload" not in message:
            return False
        
        payload = message["payload"]
        if not isinstance(payload, dict):
            return False
        
        required_fields = ["from", "message", "timestamp"]
        for field in required_fields:
            if field not in payload:
                return False
        
        return True


class WebSocketTestScenario:
    """Enhanced WebSocket test scenario builder and executor."""
    
    def __init__(self, name: str):
        self.name = name
        self.steps = []
        self.clients = {}
        self.server = None
        self.results = {}
    
    def add_step(self, step_type: str, **kwargs):
        """Add a test step to the scenario."""
        step = {
            "type": step_type,
            "params": kwargs,
            "id": len(self.steps)
        }
        self.steps.append(step)
        return self
    
    def add_client(self, client_id: str, url: str):
        """Add a client to the scenario."""
        self.clients[client_id] = WebSocketTestClient(url)
        return self
    
    def set_server(self, server: MockWebSocketServer):
        """Set the mock server for the scenario."""
        self.server = server
        return self
    
    async def execute(self):
        """Execute the test scenario."""
        self.results = {
            "scenario": self.name,
            "steps_executed": 0,
            "step_results": [],
            "success": True,
            "error": None
        }
        
        try:
            for step in self.steps:
                await self._execute_step(step)
                self.results["steps_executed"] += 1
                
        except Exception as e:
            self.results["success"] = False
            self.results["error"] = str(e)
            raise
        
        return self.results
    
    async def _execute_step(self, step: Dict):
        """Execute a single test step."""
        step_type = step["type"]
        params = step["params"]
        step_result = {"step_id": step["id"], "type": step_type, "success": True}
        
        try:
            if step_type == "connect_client":
                client_id = params["client_id"]
                await self.clients[client_id].connect()
                step_result["result"] = f"Client {client_id} connected"
                
            elif step_type == "send_message":
                client_id = params["client_id"]
                message = params["message"]
                await self.clients[client_id].send_message(message)
                step_result["result"] = f"Message sent by {client_id}"
                
            elif step_type == "receive_message":
                client_id = params["client_id"]
                timeout = params.get("timeout", 5.0)
                response = await self.clients[client_id].receive_json_message(timeout)
                step_result["result"] = response
                
            elif step_type == "send_and_receive":
                client_id = params["client_id"]
                message = params["message"]
                timeout = params.get("timeout", 5.0)
                response = await self.clients[client_id].send_and_receive_json(message, timeout)
                step_result["result"] = response
                
            elif step_type == "wait":
                duration = params["duration"]
                await asyncio.sleep(duration)
                step_result["result"] = f"Waited {duration} seconds"
                
            elif step_type == "broadcast":
                message = params["message"]
                await self.server.broadcast(message)
                step_result["result"] = "Broadcast sent"
                
            elif step_type == "validate_message":
                client_id = params["client_id"]
                validator = params["validator"]
                message_index = params.get("message_index", -1)
                
                received_messages = self.clients[client_id].get_received_messages()
                if received_messages:
                    message_str = received_messages[message_index]
                    message = json.loads(message_str)
                    is_valid = validator(message)
                    step_result["result"] = f"Message validation: {is_valid}"
                    if not is_valid:
                        step_result["success"] = False
                else:
                    step_result["success"] = False
                    step_result["result"] = "No messages to validate"
                
            elif step_type == "disconnect_client":
                client_id = params["client_id"]
                await self.clients[client_id].disconnect()
                step_result["result"] = f"Client {client_id} disconnected"
                
            else:
                raise ValueError(f"Unknown step type: {step_type}")
                
        except Exception as e:
            step_result["success"] = False
            step_result["error"] = str(e)
            
        self.results["step_results"].append(step_result)
    
    async def cleanup(self):
        """Clean up all clients and server."""
        for client in self.clients.values():
            if client.is_connected:
                await client.disconnect()
        
        if self.server and self.server.is_running:
            await self.server.stop()


# Message Generation Utilities
def generate_test_user_message(user_id: str = None, env_id: str = None, 
                             message: str = None, client_id: str = None,
                             timestamp: str = None) -> Dict:
    """Generate a test user input message."""
    return {
        "type": "user-input",
        "user_id": user_id or f"test_user_{uuid.uuid4().hex[:8]}",
        "env_id": env_id or f"test_env_{uuid.uuid4().hex[:8]}",
        "client_id": client_id or f"test_client_{uuid.uuid4().hex[:8]}",
        "message": message or "Test message from user",
        "timestamp": timestamp or datetime.now().isoformat()
    }


def generate_test_final_answer(client_id: str = None, answer: str = None,
                             user_id: str = None, env_id: str = None,
                             timestamp: str = None) -> Dict:
    """Generate a test final answer message."""
    return {
        "type": "final-answer",
        "client_id": client_id or f"test_client_{uuid.uuid4().hex[:8]}",
        "answer": answer or "This is a test final answer from NOUS.",
        "user_id": user_id,
        "env_id": env_id,
        "timestamp": timestamp or datetime.now().isoformat()
    }


def generate_test_error_message(client_id: str = None, error: str = None,
                              timestamp: str = None) -> Dict:
    """Generate a test error message."""
    return {
        "type": "error",
        "client_id": client_id or f"test_client_{uuid.uuid4().hex[:8]}",
        "error": error or "Test error message",
        "timestamp": timestamp or datetime.now().isoformat()
    }


def generate_test_heartbeat(server_time: int = None, active_clients: int = None) -> Dict:
    """Generate a test heartbeat message."""
    return {
        "id": "server",
        "type": "heartbeat",
        "payload": {
            "server_time": server_time or int(datetime.now().timestamp() * 1000),
            "active_clients": active_clients or 1
        }
    }


def generate_test_broadcast(from_client: str = None, message: str = None,
                          timestamp: str = None) -> Dict:
    """Generate a test broadcast message."""
    return {
        "type": "broadcast",
        "payload": {
            "from": from_client or f"test_client_{uuid.uuid4().hex[:8]}",
            "message": message or "Test broadcast message",
            "timestamp": timestamp or datetime.now().isoformat()
        }
    }


# Advanced Test Scenario Builders
class NOUSConversationScenario(WebSocketTestScenario):
    """Pre-built scenario for testing NOUS conversations."""
    
    def __init__(self, user_id: str = None, env_id: str = None):
        super().__init__("NOUS Conversation Test")
        self.user_id = user_id or f"nous_user_{uuid.uuid4().hex[:8]}"
        self.env_id = env_id or f"nous_env_{uuid.uuid4().hex[:8]}"
    
    def build_single_turn_conversation(self, question: str, expected_keywords: List[str] = None):
        """Build a single-turn conversation scenario."""
        client_id = f"nous_client_{uuid.uuid4().hex[:8]}"
        
        self.add_client(client_id, "ws://localhost:8765")
        self.add_step("connect_client", client_id=client_id)
        
        user_message = generate_test_user_message(
            user_id=self.user_id,
            env_id=self.env_id,
            message=question,
            client_id=client_id
        )
        
        self.add_step("send_message", client_id=client_id, message=user_message)
        self.add_step("receive_message", client_id=client_id, timeout=10.0)
        
        if expected_keywords:
            def keyword_validator(message):
                if message.get("type") != "final-answer":
                    return False
                answer = message.get("answer", "").lower()
                return all(keyword.lower() in answer for keyword in expected_keywords)
            
            self.add_step("validate_message", 
                         client_id=client_id, 
                         validator=keyword_validator)
        
        self.add_step("disconnect_client", client_id=client_id)
        return self
    
    def build_multi_turn_conversation(self, conversation_turns: List[Dict]):
        """Build a multi-turn conversation scenario."""
        client_id = f"nous_client_{uuid.uuid4().hex[:8]}"
        
        self.add_client(client_id, "ws://localhost:8765")
        self.add_step("connect_client", client_id=client_id)
        
        for turn in conversation_turns:
            user_message = generate_test_user_message(
                user_id=self.user_id,
                env_id=self.env_id,
                message=turn["question"],
                client_id=client_id
            )
            
            self.add_step("send_message", client_id=client_id, message=user_message)
            self.add_step("receive_message", client_id=client_id, timeout=10.0)
            
            if "expected_keywords" in turn:
                def make_keyword_validator(keywords):
                    def keyword_validator(message):
                        if message.get("type") != "final-answer":
                            return False
                        answer = message.get("answer", "").lower()
                        return all(keyword.lower() in answer for keyword in keywords)
                    return keyword_validator
                
                self.add_step("validate_message", 
                             client_id=client_id, 
                             validator=make_keyword_validator(turn["expected_keywords"]))
            
            # Add small delay between turns
            self.add_step("wait", duration=0.5)
        
        self.add_step("disconnect_client", client_id=client_id)
        return self


class WebSocketStressTestScenario(WebSocketTestScenario):
    """Pre-built scenario for WebSocket stress testing."""
    
    def __init__(self, num_clients: int = 10):
        super().__init__(f"WebSocket Stress Test ({num_clients} clients)")
        self.num_clients = num_clients
    
    def build_concurrent_messaging_scenario(self, messages_per_client: int = 5):
        """Build a concurrent messaging stress test."""
        # Add multiple clients
        client_ids = []
        for i in range(self.num_clients):
            client_id = f"stress_client_{i}"
            client_ids.append(client_id)
            self.add_client(client_id, "ws://localhost:8765")
            self.add_step("connect_client", client_id=client_id)
        
        # Send messages from all clients concurrently
        for msg_num in range(messages_per_client):
            for client_id in client_ids:
                message = generate_test_user_message(
                    message=f"Stress test message {msg_num + 1}",
                    client_id=client_id
                )
                self.add_step("send_message", client_id=client_id, message=message)
        
        # Receive responses
        for msg_num in range(messages_per_client):
            for client_id in client_ids:
                self.add_step("receive_message", client_id=client_id, timeout=15.0)
        
        # Disconnect all clients
        for client_id in client_ids:
            self.add_step("disconnect_client", client_id=client_id)
        
        return self


# Performance Testing Utilities
class WebSocketPerformanceTracker:
    """Track WebSocket performance metrics."""
    
    def __init__(self):
        self.metrics = {
            "message_count": 0,
            "total_response_time": 0.0,
            "min_response_time": float('inf'),
            "max_response_time": 0.0,
            "error_count": 0,
            "start_time": None,
            "end_time": None
        }
    
    def start_tracking(self):
        """Start performance tracking."""
        self.metrics["start_time"] = datetime.now()
    
    def stop_tracking(self):
        """Stop performance tracking."""
        self.metrics["end_time"] = datetime.now()
    
    def record_message(self, response_time: float, error: bool = False):
        """Record a message performance metric."""
        self.metrics["message_count"] += 1
        
        if error:
            self.metrics["error_count"] += 1
        else:
            self.metrics["total_response_time"] += response_time
            self.metrics["min_response_time"] = min(self.metrics["min_response_time"], response_time)
            self.metrics["max_response_time"] = max(self.metrics["max_response_time"], response_time)
    
    def get_performance_report(self) -> Dict:
        """Get comprehensive performance report."""
        if self.metrics["message_count"] == 0:
            return self.metrics
        
        successful_messages = self.metrics["message_count"] - self.metrics["error_count"]
        
        report = self.metrics.copy()
        
        if successful_messages > 0:
            report["average_response_time"] = self.metrics["total_response_time"] / successful_messages
            report["success_rate"] = successful_messages / self.metrics["message_count"]
        else:
            report["average_response_time"] = 0.0
            report["success_rate"] = 0.0
        
        if self.metrics["start_time"] and self.metrics["end_time"]:
            duration = (self.metrics["end_time"] - self.metrics["start_time"]).total_seconds()
            report["total_duration"] = duration
            report["messages_per_second"] = self.metrics["message_count"] / duration if duration > 0 else 0
        
        return report 