#!/usr/bin/env python3

"""
Socket.IO Server for NOUS service
Compatible with NestJS Socket.IO clients
"""

import asyncio
import logging
import socketio
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class NOUSSocketIOServer:
    """Socket.IO server for NOUS service"""
    
    def __init__(self):
        # Create Socket.IO server
        self.sio = socketio.AsyncServer(
            cors_allowed_origins="*",
            logger=logger,
            engineio_logger=logger
        )
        
        # Connected clients
        self.connected_clients: Dict[str, Dict[str, Any]] = {}
        
        # Message handler registry
        self.message_handlers: Dict[str, Any] = {}
        
        # Register event handlers
        self.sio.on('connect', self.handle_connect)
        self.sio.on('disconnect', self.handle_disconnect)
        self.sio.on('message', self.handle_message)
        
        # Register standard handlers
        self.register_handler('ping', self.handle_ping)
        self.register_handler('process-chat-input', self.handle_process_chat_input)
        self.register_handler('generate-response', self.handle_generate_response)
        
    def register_handler(self, message_type: str, handler):
        """Register a message handler"""
        self.message_handlers[message_type] = handler
        logger.info(f"Registered handler for message type: {message_type}")
    
    async def handle_connect(self, sid: str, environ: dict):
        """Handle client connection"""
        self.connected_clients[sid] = {
            'connected_at': asyncio.get_event_loop().time(),
            'environ': environ
        }
        logger.info(f"Client connected: {sid}")
        
        # Send connection confirmation
        await self.sio.emit('connection', {
            'message': 'Successfully connected to NOUS service',
            'timestamp': asyncio.get_event_loop().time()
        }, room=sid)
    
    async def handle_disconnect(self, sid: str):
        """Handle client disconnection"""
        if sid in self.connected_clients:
            del self.connected_clients[sid]
        logger.info(f"Client disconnected: {sid}")
    
    async def handle_message(self, sid: str, data: Dict[str, Any]):
        """Handle incoming messages"""
        try:
            message_id = data.get('id', 'unknown')
            message_type = data.get('type', 'unknown')
            action = data.get('action', message_type)
            payload = data.get('payload', {})
            
            logger.debug(f"Received message from {sid}: type={action}, id={message_id}")
            
            # Find and execute handler
            if action in self.message_handlers:
                handler = self.message_handlers[action]
                try:
                    result = await handler(payload, sid)
                    
                    # Send success response
                    response = {
                        'id': message_id,
                        'type': 'response',
                        'success': True,
                        'payload': result,
                        'request_id': message_id
                    }
                    await self.sio.emit('message', response, room=sid)
                    
                except Exception as e:
                    logger.error(f"Handler error for {action}: {e}")
                    # Send error response
                    response = {
                        'id': message_id,
                        'type': 'response',
                        'success': False,
                        'error': str(e),
                        'request_id': message_id
                    }
                    await self.sio.emit('message', response, room=sid)
            else:
                logger.warning(f"No handler for message type: {action}")
                # Send error response
                response = {
                    'id': message_id,
                    'type': 'response',
                    'success': False,
                    'error': f"No handler for message type: {action}",
                    'request_id': message_id
                }
                await self.sio.emit('message', response, room=sid)
                
        except Exception as e:
            logger.error(f"Error handling message from {sid}: {e}")
    
    async def handle_ping(self, payload: Dict[str, Any], sid: str) -> Dict[str, Any]:
        """Handle ping messages"""
        return {
            'pong': True,
            'timestamp': asyncio.get_event_loop().time()
        }
    
    async def handle_process_chat_input(self, payload: Dict[str, Any], sid: str) -> Dict[str, Any]:
        """Handle chat input processing"""
        message = payload.get('message', '')
        user_id = payload.get('userId', '')
        context = payload.get('context', {})
        
        logger.info(f"Processing chat input from {user_id}: {message}")
        
        try:
            # Use the existing NOUS user input handler if available
            if hasattr(self, '_nous_user_input_handler'):
                # Call the NOUS handler
                await self._nous_user_input_handler(user_id, context.get('environmentId', 1), message, sid)
                
                return {
                    'response': 'Processing your request...',
                    'metadata': {
                        'user_id': user_id,
                        'processed_at': asyncio.get_event_loop().time(),
                        'status': 'processing'
                    }
                }
            else:
                # Fallback mock response
                return {
                    'response': f"NOUS received: {message}",
                    'metadata': {
                        'user_id': user_id,
                        'processed_at': asyncio.get_event_loop().time(),
                        'context': context
                    }
                }
        except Exception as e:
            logger.error(f"Error processing chat input: {e}")
            return {
                'response': 'Sorry, there was an error processing your request.',
                'metadata': {
                    'user_id': user_id,
                    'error': str(e),
                    'processed_at': asyncio.get_event_loop().time()
                }
            }
    
    async def handle_generate_response(self, payload: Dict[str, Any], sid: str) -> Dict[str, Any]:
        """Handle AI response generation"""
        prompt = payload.get('prompt', '')
        context = payload.get('context', {})
        
        logger.info(f"Generating AI response for prompt: {prompt}")
        
        # TODO: Integrate with actual NOUS AI generation
        # For now, return a mock response
        return {
            'response': f"AI response to: {prompt}",
            'metadata': {
                'generated_at': asyncio.get_event_loop().time(),
                'context': context
            }
        }
    
    async def broadcast(self, event: str, data: Dict[str, Any]):
        """Broadcast message to all connected clients"""
        await self.sio.emit(event, data)
    
    async def send_to_client(self, sid: str, event: str, data: Dict[str, Any]):
        """Send message to specific client"""
        await self.sio.emit(event, data, room=sid)
    
    def get_connected_clients(self) -> list:
        """Get list of connected client IDs"""
        return list(self.connected_clients.keys())
    
    def get_client_count(self) -> int:
        """Get number of connected clients"""
        return len(self.connected_clients)
    
    def set_nous_handler(self, handler):
        """Set the NOUS user input handler"""
        self._nous_user_input_handler = handler
        logger.info("NOUS user input handler registered with Socket.IO server")
    
    async def send_final_answer(self, client_id: str, answer: str):
        """Send final answer to client"""
        await self.send_to_client(client_id, 'nous.chat/response', {
            'response': answer,
            'timestamp': asyncio.get_event_loop().time()
        })
        logger.info(f"Sent final answer to client {client_id}")
    
    async def send_error_message(self, client_id: str, error: str):
        """Send error message to client"""
        await self.send_to_client(client_id, 'nous.chat/error', {
            'error': error,
            'timestamp': asyncio.get_event_loop().time()
        })
        logger.error(f"Sent error to client {client_id}: {error}")

# Global server instance
nous_socketio_server = NOUSSocketIOServer()