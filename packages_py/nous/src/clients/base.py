import asyncio
import logging
import socketio  # python-socketio
from typing import Any, Dict, Optional, Callable
import uuid
from ..utils.binary_serialization import encode_payload, decode_payload

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
        
        # Register standard event handlers
        self.sio.on('connect', self._on_connect)
        self.sio.on('disconnect', self._on_disconnect)
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
    
    async def _on_connect_error(self, data):
        """Handle connection error"""
        logger.error(f"Connection error to {self.service_name}: {data}")
    
    
    async def send_request(self, action: str, payload: Dict[str, Any], timeout: float = 30.0) -> Dict[str, Any]:
        """Send a request and wait for response using Socket.IO acknowledgment pattern like TypeScript clients"""
        if not self.connected:
            raise ConnectionError(f"Not connected to {self.service_name}")
        
        request_id = str(uuid.uuid4())
        message = {
            'id': request_id,
            'type': 'request',
            'service': self.service_name,
            'action': action,
            'payload': encode_payload(payload)  # Binary encode outgoing payload
        }
        
        try:
            # Use sio.call() which mirrors TypeScript's emit with callback acknowledgment
            response = await self.sio.call(action, message, timeout=timeout)
            
            # Decode binary response from TypeScript services
            decoded_response = decode_payload(response)
            
            if decoded_response and decoded_response.get('success', False):
                return decoded_response.get('data', decoded_response.get('payload', {}))
            else:
                error_msg = decoded_response.get('error', 'Unknown error') if decoded_response else 'No response received'
                raise Exception(f"{self.service_name} error: {error_msg}")
                
        except asyncio.TimeoutError:
            raise TimeoutError(f"Request to {self.service_name} timed out")
        except Exception as e:
            raise e
    
    async def emit_event(self, event: str, data: Any):
        """Emit an event without expecting a response"""
        if not self.connected:
            raise ConnectionError(f"Not connected to {self.service_name}")
        
        await self.sio.emit(event, data)
    
    def is_connected(self) -> bool:
        """Check if connected to service"""
        return self.connected