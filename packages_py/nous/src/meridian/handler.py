#!/usr/bin/env python3

"""
WebSocket Handler Extension Module for creating custom handlers compatible with Clojure clients
"""

import asyncio
import inspect
import json
import logging
from typing import Dict, Any, Callable, Awaitable, Optional, Union

from websocket_server import ws_server, WebSocketResponse

logger = logging.getLogger("websocket_handler")


class DependencyContainer:
    """Container for storing and injecting dependencies"""

    def __init__(self):
        self._deps = {}

    def register(self, name: str, dependency: Any):
        """Register a dependency"""
        self._deps[name] = dependency
        return self

    def get(self, name: str) -> Any:
        """Get a dependency by name"""
        return self._deps.get(name)

    def has(self, name: str) -> bool:
        """Check if a dependency exists"""
        return name in self._deps

    def as_dict(self) -> Dict[str, Any]:
        """Get all dependencies as a dictionary"""
        return self._deps.copy()


# Create a container for dependencies
dependencies = DependencyContainer()


def register_handler(msg_type: str):
    """Decorator to register a handler function for a message type"""

    def decorator(func: Callable[[Dict, str, DependencyContainer], Awaitable[Dict]]):
        async def wrapper(payload: Dict, client_id: str) -> Dict:
            # Inspect function signature to determine what to inject
            sig = inspect.signature(func)
            kwargs = {}

            # Include payload if parameter exists
            if "payload" in sig.parameters:
                kwargs["payload"] = payload

            # Include client_id if parameter exists
            if "client_id" in sig.parameters:
                kwargs["client_id"] = client_id

            # Include dependencies if parameter exists
            if "deps" in sig.parameters:
                kwargs["deps"] = dependencies

            # Include specific dependency parameters
            for param_name in sig.parameters:
                if param_name not in ["payload", "client_id", "deps"]:
                    if dependencies.has(param_name):
                        kwargs[param_name] = dependencies.get(param_name)

            # Call the handler function with the appropriate arguments
            return await func(**kwargs)

        # Register the wrapper function with the server
        ws_server.register_handler(msg_type, wrapper)
        logger.info(f"Registered handler for message type: {msg_type}")

        return func

    return decorator


async def send_response(client_id: str, msg_id: str, response_data: Dict,
                         response_type: str = "response") -> bool:
    """Helper function to send a response to a client"""
    response = {
        "id": msg_id,
        "type": response_type,
        "payload": response_data
    }
    return await ws_server.send(client_id, response)


async def broadcast_message(msg_type: str, payload: Dict) -> int:
    """Helper function to broadcast a message to all clients"""
    message = {
        "id": "server",
        "type": msg_type,
        "payload": payload
    }
    return await ws_server.broadcast(message)


# Example handler using the decorator
@register_handler("example")
async def example_handler(payload: Dict, client_id: str, deps: DependencyContainer) -> Dict:
    """Example handler that uses the dependency container"""
    logger.info(f"Example handler called by client {client_id} with payload: {payload}")

    # Use dependencies if available
    db = deps.get("database")
    if db:
        # Use the database dependency
        pass

    return {
        "message": "Example handler processed your request successfully",
        "echo": payload
    }


def initialize_with_dependencies(**kwargs):
    """Initialize the handler with dependencies"""
    for name, dependency in kwargs.items():
        dependencies.register(name, dependency)
    logger.info(f"Initialized with dependencies: {list(kwargs.keys())}")
