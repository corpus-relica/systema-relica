#!/usr/bin/env python3

"""
Binary serialization utilities for NOUS service
Compatible with TypeScript msgpackr implementation
"""

import logging
import msgpack
from typing import Any, Dict, List, Union

logger = logging.getLogger(__name__)

def encode_payload(data: Any) -> Dict[str, List[int]]:
    """
    Encode payload using msgpack and convert to JSON-transportable format
    
    Args:
        data: Any data to encode
        
    Returns:
        Dict with 'data' key containing byte array as list of integers
        Format: { "data": [byte1, byte2, byte3, ...] }
    """
    if data is None:
        return data
        
    try:
        # Pack data using msgpack
        packed = msgpack.packb(data, use_bin_type=True)
        
        # Convert bytes to list of integers for JSON transport
        byte_list = list(packed)
        
        return {"data": byte_list}
        
    except Exception as e:
        logger.warning(f"Failed to encode payload, sending as-is: {e}")
        return data

def decode_payload(encoded_data: Union[Dict[str, List[int]], Any]) -> Any:
    """
    Decode binary payload from TypeScript services
    
    Args:
        encoded_data: Either encoded format {"data": [bytes]} or plain data
        
    Returns:
        Decoded original data
    """
    if not encoded_data:
        return encoded_data
        
    try:
        # Check if this is binary-encoded format
        if isinstance(encoded_data, dict) and "data" in encoded_data:
            byte_list = encoded_data["data"]
            
            # Convert list of integers back to bytes
            if isinstance(byte_list, list):
                packed_bytes = bytes(byte_list)
                
                # Unpack using msgpack
                return msgpack.unpackb(packed_bytes, raw=False)
        
        # If not binary format, return as-is (fallback for non-binary data)
        return encoded_data
        
    except Exception as e:
        logger.warning(f"Failed to decode binary payload, returning as-is: {e}")
        return encoded_data

def decode_request(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    Decode incoming request message from TypeScript services
    
    Args:
        message: Incoming message that may be binary-encoded
        
    Returns:
        Decoded message with payload decoded if needed
    """
    if not isinstance(message, dict):
        return message
        
    try:
        # Make a copy to avoid modifying original
        decoded_message = message.copy()
        
        # Decode payload if present
        if "payload" in decoded_message:
            decoded_message["payload"] = decode_payload(decoded_message["payload"])
            
        return decoded_message
        
    except Exception as e:
        logger.warning(f"Failed to decode request message: {e}")
        return message

def encode_response_data(data: Any) -> Dict[str, Any]:
    """
    Encode response data for sending to TypeScript services
    
    Args:
        data: Response data to encode
        
    Returns:
        Encoded response in format expected by TypeScript services
    """
    if not data:
        return data
        
    try:
        packed = msgpack.packb(data, use_bin_type=True)
        return {"data": list(packed)}
        
    except Exception as e:
        logger.warning(f"Failed to encode response, sending as JSON: {e}")
        return data

def to_binary_broadcast_event(event_type: str, data: Any) -> Dict[str, Any]:
    """
    Create binary-encoded broadcast event for backend services
    
    Args:
        event_type: Event type string
        data: Event data to encode
        
    Returns:
        Binary-encoded broadcast event
    """
    import time
    
    event = {
        "type": event_type,
        "data": data,
        "timestamp": int(time.time() * 1000),  # milliseconds
        "source": "nous"
    }
    
    return encode_response_data(event)

def to_json_broadcast_event(event_type: str, data: Any) -> Dict[str, Any]:
    """
    Create JSON broadcast event for Portal/frontend
    
    Args:
        event_type: Event type string  
        data: Event data
        
    Returns:
        JSON broadcast event
    """
    import time
    
    return {
        "type": event_type,
        "data": data,
        "timestamp": int(time.time() * 1000),  # milliseconds
        "source": "nous"
    }