import asyncio
import logging
import socketio
from typing import Any, Dict, Optional, Callable
import uuid

logger = logging.getLogger(__name__)

class BaseSocketIOClient:
    """Base Socket.IO client for connecting to NestJS services"""
    
    def __init__(self, service_name: str, host: str, port: int):
        self.service_name = service_name
        self.host = host
        self.port = port
        self.url = f"ws://{host}:{port}"
        self.sio = socketio.AsyncClient(
            reconnection=True,
            reconnection_attempts=5,
            reconnection_delay=1,
            logger=logger,
            engineio_logger=logger
        )
        self.connected = False
        self.pending_requests: Dict[str, asyncio.Future] = {}
        
        # Register standard event handlers
        self.sio.on('connect', self._on_connect)
        self.sio.on('disconnect', self._on_disconnect)
        self.sio.on('message', self._on_message)
        self.sio.on('connect_error', self._on_connect_error)
    
    async def connect(self) -> bool:
        """Connect to the service"""
        try:
            logger.info(f"Connecting to {self.service_name} at {self.url}")
            await self.sio.connect(self.url, transports=['websocket'])
            return True
        except Exception as e:
            logger.error(f"Failed to connect to {self.service_name}: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from the service"""
        if self.connected:
            await self.sio.disconnect()
    
    async def _on_connect(self):
        """Handle connection event"""
        self.connected = True
        logger.info(f"Connected to {self.service_name} service")
    
    async def _on_disconnect(self):
        """Handle disconnect event"""
        self.connected = False
        logger.warning(f"Disconnected from {self.service_name} service")
        
        # Reject all pending requests
        for request_id, future in self.pending_requests.items():
            if not future.done():
                future.set_exception(ConnectionError(f"Disconnected from {self.service_name}"))
        self.pending_requests.clear()
    
    async def _on_connect_error(self, data):
        """Handle connection error"""
        logger.error(f"Connection error to {self.service_name}: {data}")
    
    async def _on_message(self, data):
        """Handle incoming messages"""
        if isinstance(data, dict) and 'id' in data:
            request_id = data['id']
            if request_id in self.pending_requests:
                future = self.pending_requests.pop(request_id)
                if not future.done():
                    future.set_result(data)
    
    async def send_request(self, action: str, payload: Dict[str, Any], timeout: float = 30.0) -> Dict[str, Any]:
        """Send a request and wait for response"""
        if not self.connected:
            raise ConnectionError(f"Not connected to {self.service_name}")
        
        request_id = str(uuid.uuid4())
        message = {
            'id': request_id,
            'type': 'request',
            'service': self.service_name,
            'action': action,
            'payload': payload
        }
        
        # Create future for response
        future = asyncio.Future()
        self.pending_requests[request_id] = future
        
        try:
            # Send message
            await self.sio.emit('message', message)
            
            # Wait for response
            response = await asyncio.wait_for(future, timeout=timeout)
            
            if response.get('success', False):
                return response.get('payload', {})
            else:
                error_msg = response.get('error', 'Unknown error')
                raise Exception(f"{self.service_name} error: {error_msg}")
                
        except asyncio.TimeoutError:
            self.pending_requests.pop(request_id, None)
            raise TimeoutError(f"Request to {self.service_name} timed out")
        except Exception as e:
            self.pending_requests.pop(request_id, None)
            raise e
    
    async def emit_event(self, event: str, data: Any):
        """Emit an event without expecting a response"""
        if not self.connected:
            raise ConnectionError(f"Not connected to {self.service_name}")
        
        await self.sio.emit(event, data)
    
    def is_connected(self) -> bool:
        """Check if connected to service"""
        return self.connected