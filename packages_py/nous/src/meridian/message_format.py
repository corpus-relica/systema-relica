#!/usr/bin/env python3
"""
Message Format Handler for WebSocket server to support both JSON and EDN formats
"""
import edn_format
import json
import logging
from typing import Dict, Any, Union, Optional
import re

from src.meridian.edn2python import edn_to_python, edn_string_to_json

# Disable edn_format verbose logging
logging.getLogger("edn_format.edn_lex").setLevel(logging.WARNING)
logging.getLogger("edn_format.edn_parse").setLevel(logging.WARNING)

import edn_format

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("message_format")

# Format types
FORMAT_JSON = "json"
FORMAT_EDN = "edn"

def serialize_message(message: Dict[str, Any], format_type: str) -> str:
    """
    Serialize a message to the specified format

    Args:
        message: The message to serialize
        format_type: The format type (json or edn)

    Returns:
        The serialized message as a string
    """
    if format_type.lower() == FORMAT_JSON:
        return json.dumps(message)
    elif format_type.lower() == FORMAT_EDN:
        # Convert to EDN format
        return dict_to_edn_str(message)
    else:
        logger.warning(f"Unknown format type: {format_type}, defaulting to JSON")
        return json.dumps(message)


def dict_to_edn_str(data: Any) -> str:
    """
    Convert Python dict to EDN string

    Args:
        data: Python data to convert to EDN string

    Returns:
        EDN formatted string
    """
    if isinstance(data, dict):
        parts = []
        for k, v in data.items():
            parts.append(f":{k} {dict_to_edn_str(v)}")
        return "{" + " ".join(parts) + "}"
    elif isinstance(data, list):
        parts = [dict_to_edn_str(item) for item in data]
        return "[" + " ".join(parts) + "]"
    elif isinstance(data, str):
        # Escape double quotes in the string before wrapping it
        escaped_string = data.replace('"', '\\"')
        return f'"{escaped_string}"'
    elif isinstance(data, bool):
        return "true" if data else "false"
    elif data is None:
        return "nil"
    else:
        return str(data)


def deserialize_message(message_str: str, format_type: str) -> Optional[Dict[str, Any]]:
    """
    Deserialize a message from the specified format

    Args:
        message_str: The message string to deserialize
        format_type: The format type (json or edn)

    Returns:
        The deserialized message as a dictionary, or None if deserialization fails
    """
    try:
        if format_type.lower() == FORMAT_JSON:
            return json.loads(message_str)
        elif format_type.lower() == FORMAT_EDN:
            # Try our custom EDN parser first
            try:
                # Debug log of raw message to help with debugging
                # print(f"Raw EDN message: {message_str}")

                result = edn_format.loads(message_str) #parse_edn_message(message_str)
                result = edn_to_python(result)

                # first of result keys
                # foo = result.keys()
                # foo = list(foo)

                # print(f"%%%%%%%%%%%% RESULT RESULT RESULT RESULT : {result}")


                # # Convert keyword keys to string keys without colons for Clojure compatibility
                # # For example, :type becomes "type"
                # if 'type' not in result and any(k.startswith(':') for k in result.keys()):
                #     converted_result = {}
                #     for k, v in result.items():
                #         if k.startswith(':'):
                #             # Remove the colon from keywords
                #             converted_result[k[1:]] = v
                #         else:
                #             converted_result[k] = v
                #     result = converted_result

                # logger.debug(f"Parsed EDN message: {result}")

                return result
            except Exception as e:
                logger.error(f"Error with custom EDN parser: {str(e)}. Trying edn_format library.")
                try:
                    # Disable warnings for edn_format during parsing
                    logging.getLogger("edn_format").setLevel(logging.ERROR)

                    # Fall back to edn_format if available
                    parsed = edn_format.loads(message_str)
                    result = edn_to_dict(parsed)

                    # Restore log level
                    logging.getLogger("edn_format").setLevel(logging.WARNING)

                    return result
                except Exception as e2:
                    logger.error(f"Error with edn_format library: {str(e2)}")

                    # Special handling for EDN format that may have Clojure-style keywords
                    # Try a very simple parse for basic maps with keywords
                    if message_str.startswith('{') and message_str.endswith('}'):
                        try:
                            # Convert Clojure-style keywords to JSON style
                            json_like = re.sub(r':(\w+)', r'"\1":', message_str)
                            # Fix trailing commas if any
                            json_like = re.sub(r',\s*}', '}', json_like)
                            return json.loads(json_like)
                        except Exception:
                            pass

                    raise e
        else:
            logger.warning(f"Unknown format type: {format_type}, trying JSON")
            return json.loads(message_str)
    except Exception as e:
        logger.error(f"Error deserializing message: {str(e)}")

        # # Try the other format as a fallback
        # try:
        #     if format_type.lower() == FORMAT_JSON:
        #         return parse_edn_message(message_str)
        #     else:
        #         return json.loads(message_str)
        # except Exception as e2:
        #     logger.error(f"Failed fallback deserialization: {str(e2)}")
        #     return None


def edn_to_dict(edn_data):
    """Convert data from edn_format to Python dict"""
    if isinstance(edn_data, edn_format.Keyword):
        return str(edn_data)[1:]  # Remove the leading :
    elif hasattr(edn_data, 'keys') and callable(getattr(edn_data, 'items', None)):  # Dictionary-like
        result = {}
        for k, v in edn_data.items():
            key = edn_to_dict(k)
            result[key] = edn_to_dict(v)
        return result
    elif isinstance(edn_data, (list, tuple)):
        return [edn_to_dict(item) for item in edn_data]
    elif isinstance(edn_data, (set, frozenset)) or (hasattr(edn_data, '__iter__') and
              not isinstance(edn_data, (str, bytes, dict)) and
              not hasattr(edn_data, 'keys')):
        # Handle ImmutableSet and other set-like types
        return [edn_to_dict(item) for item in edn_data]
    else:
        return edn_data
