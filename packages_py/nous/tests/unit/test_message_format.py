"""
Unit tests for the message_format module.

Tests the EDN to Python conversion and message formatting functionality.
"""

import pytest
from unittest.mock import patch, MagicMock

from src.meridian.message_format import (
    serialize_message,
    deserialize_message,
    dict_to_edn_str,
    edn_to_dict,
    FORMAT_JSON,
    FORMAT_EDN
)


class TestMessageSerialization:
    """Test message serialization functionality."""
    
    def test_json_serialization(self):
        """Test JSON message serialization."""
        message = {
            "type": "user-input",
            "user_id": "test_user_123",
            "message": "Hello, world!"
        }
        
        result = serialize_message(message, FORMAT_JSON)
        
        assert isinstance(result, str)
        assert "user-input" in result
        assert "test_user_123" in result
        assert "Hello, world!" in result
    
    def test_edn_serialization(self):
        """Test EDN message serialization."""
        message = {
            "type": "user-input",
            "user_id": "test_user_123",
            "value": 42
        }
        
        result = serialize_message(message, FORMAT_EDN)
        
        assert isinstance(result, str)
        assert ":type" in result
        assert ":user_id" in result
        assert ":value" in result
        assert "user-input" in result
        assert "42" in result
    
    def test_unknown_format_defaults_to_json(self):
        """Test that unknown format defaults to JSON."""
        message = {"test": "data"}
        
        result = serialize_message(message, "unknown_format")
        
        # Should default to JSON
        assert isinstance(result, str)
        assert '"test"' in result
        assert '"data"' in result


class TestMessageDeserialization:
    """Test message deserialization functionality."""
    
    def test_json_deserialization(self):
        """Test JSON message deserialization."""
        json_message = '{"type": "user-input", "user_id": "test_user", "value": 42}'
        
        result = deserialize_message(json_message, FORMAT_JSON)
        
        assert isinstance(result, dict)
        assert result["type"] == "user-input"
        assert result["user_id"] == "test_user"
        assert result["value"] == 42
    
    def test_invalid_json_handling(self):
        """Test handling of invalid JSON."""
        invalid_json = '{"invalid": json structure'
        
        result = deserialize_message(invalid_json, FORMAT_JSON)
        
        # Should return None on error
        assert result is None
    
    def test_empty_message_handling(self):
        """Test handling of empty messages."""
        result = deserialize_message("", FORMAT_JSON)
        assert result is None


class TestEdnToDictConversion:
    """Test EDN to dictionary conversion functionality."""
    
    def test_simple_edn_to_dict(self):
        """Test basic EDN to dict conversion."""
        # This would typically be called with edn_format objects
        # For testing, we'll test with simple data types
        simple_data = "test_string"
        result = edn_to_dict(simple_data)
        assert result == "test_string"
    
    def test_list_edn_to_dict(self):
        """Test list EDN to dict conversion."""
        list_data = [1, 2, "test"]
        result = edn_to_dict(list_data)
        assert result == [1, 2, "test"]
    
    def test_nested_structure_edn_to_dict(self):
        """Test nested structure conversion."""
        nested_data = {"key": [1, 2, {"nested": "value"}]}
        result = edn_to_dict(nested_data)
        assert result == {"key": [1, 2, {"nested": "value"}]}


class TestDictToEdnString:
    """Test dictionary to EDN string conversion."""
    
    def test_simple_dict_to_edn(self):
        """Test basic dict to EDN string conversion."""
        data = {"type": "test", "value": 42}
        result = dict_to_edn_str(data)
        
        assert isinstance(result, str)
        assert ":type" in result
        assert ":value" in result
        assert "test" in result
        assert "42" in result
    
    def test_nested_dict_to_edn(self):
        """Test nested dict to EDN string conversion."""
        data = {
            "user": {"id": 123, "name": "Test User"},
            "facts": [{"id": 1, "type": "entity"}]
        }
        result = dict_to_edn_str(data)
        
        assert isinstance(result, str)
        assert ":user" in result
        assert ":facts" in result
        assert "123" in result
        assert "Test User" in result
    
    def test_string_escaping_in_edn(self):
        """Test that strings with quotes are properly escaped."""
        data = {"message": 'Hello "world"'}
        result = dict_to_edn_str(data)
        
        assert isinstance(result, str)
        assert '\\"' in result  # Should escape quotes
    
    def test_boolean_conversion_in_edn(self):
        """Test boolean conversion in EDN."""
        data = {"active": True, "disabled": False}
        result = dict_to_edn_str(data)
        
        assert "true" in result
        assert "false" in result
    
    def test_none_conversion_in_edn(self):
        """Test None conversion to nil in EDN."""
        data = {"value": None}
        result = dict_to_edn_str(data)
        
        assert "nil" in result
    
    def test_list_conversion_in_edn(self):
        """Test list conversion in EDN."""
        data = {"items": [1, "test", True]}
        result = dict_to_edn_str(data)
        
        assert "[" in result
        assert "]" in result
        assert "1" in result
        assert "test" in result
        assert "true" in result


@pytest.mark.unit
class TestMessageFormatIntegration:
    """Integration tests for message format functionality."""
    
    def test_json_roundtrip_conversion(self):
        """Test JSON serialization and deserialization roundtrip."""
        original_data = {
            "type": "user-input",
            "user_id": "test_user_123",
            "message": "Hello World",
            "value": 42,
            "active": True
        }
        
        # Serialize to JSON and back
        json_string = serialize_message(original_data, FORMAT_JSON)
        converted_back = deserialize_message(json_string, FORMAT_JSON)
        
        assert converted_back == original_data
    
    @pytest.mark.parametrize("message_type,user_id,content", [
        ("user-input", "user1", "Hello"),
        ("final-answer", "user_with_special_chars_123", "Message with special chars: !@#$%"),
        ("error", "unicode_user_🤖", "Unicode message: 你好世界"),
    ])
    def test_message_serialization_with_various_inputs(self, message_type, user_id, content):
        """Test message serialization with various input types."""
        message = {
            "type": message_type,
            "user_id": user_id,
            "content": content
        }
        
        # Test both JSON and EDN serialization
        json_result = serialize_message(message, FORMAT_JSON)
        edn_result = serialize_message(message, FORMAT_EDN)
        
        assert isinstance(json_result, str)
        assert isinstance(edn_result, str)
        assert message_type in json_result
        assert user_id in json_result
        assert content in json_result
    
    def test_format_constants(self):
        """Test that format constants are properly defined."""
        assert FORMAT_JSON == "json"
        assert FORMAT_EDN == "edn"


@pytest.mark.unit
class TestErrorHandling:
    """Test error handling in message format functions."""
    
    def test_serialize_with_non_serializable_data(self):
        """Test serialization with non-serializable data."""
        # JSON serialization should handle this gracefully
        message = {"function": lambda x: x}  # Functions aren't JSON serializable
        
        with pytest.raises(TypeError):
            serialize_message(message, FORMAT_JSON)
    
    def test_deserialize_malformed_json(self):
        """Test deserialization of malformed JSON."""
        malformed_json = '{"key": value without quotes}'
        
        result = deserialize_message(malformed_json, FORMAT_JSON)
        assert result is None
    
    def test_deserialize_empty_string(self):
        """Test deserialization of empty string."""
        result = deserialize_message("", FORMAT_JSON)
        assert result is None 