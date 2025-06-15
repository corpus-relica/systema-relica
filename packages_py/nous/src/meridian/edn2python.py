#!/usr/bin/env python3

import json
import datetime
import uuid
import fractions
import decimal
from edn_format import loads, dumps, Keyword, Symbol, ImmutableDict, ImmutableList, Char, TaggedElement

def edn_to_python(obj):
    """
    Convert EDN data structures to Python native types that are JSON-serializable.

    Handles:
    - Keyword -> string (prefixed with ":")
    - Symbol -> string
    - ImmutableDict -> dict
    - ImmutableList -> list
    - set/frozenset -> list
    - Char -> string
    - datetime -> ISO format string
    - UUID -> string
    - Fraction -> string representation
    - Decimal -> float
    """
    if obj is None:
        return None
    elif isinstance(obj, bool):
        return obj
    elif isinstance(obj, (int, float, str)):
        return obj
    elif isinstance(obj, Keyword):
        # Convert keywords to strings prefixed with ":"
        return f"{obj.name}"
    elif isinstance(obj, Symbol):
        # Convert symbols to plain strings
        return str(obj)
    elif isinstance(obj, (ImmutableDict, dict)):
        # Convert ImmutableDict to regular dict
        return {edn_to_python(k): edn_to_python(v) for k, v in obj.items()}
    elif isinstance(obj, (ImmutableList, list, tuple)):
        # Convert ImmutableList/tuple to regular list
        return [edn_to_python(item) for item in obj]
    elif isinstance(obj, (set, frozenset)):
        # Convert sets to lists
        return [edn_to_python(item) for item in obj]
    elif isinstance(obj, Char):
        # Convert Char to string
        return str(obj)
    elif isinstance(obj, datetime.datetime):
        # Convert datetime to ISO format string
        return obj.isoformat()
    elif isinstance(obj, datetime.date):
        # Convert date to ISO format string
        return obj.isoformat()
    elif isinstance(obj, uuid.UUID):
        # Convert UUID to string
        return str(obj)
    elif isinstance(obj, fractions.Fraction):
        # Convert Fraction to string representation
        return f"{obj.numerator}/{obj.denominator}"
    elif isinstance(obj, decimal.Decimal):
        # Convert Decimal to float
        return float(obj)
    elif isinstance(obj, TaggedElement):
        # For tagged elements, convert to a dict with tag and value
        return {
            "tag": getattr(obj, "name", "tagged"),
            "value": edn_to_python(getattr(obj, "value", obj))
        }
    else:
        # For unknown types, convert to string
        return str(obj)

def edn_string_to_json(edn_string):
    """
    Convert an EDN string to a JSON string.
    """
    # Parse the EDN string
    edn_data = loads(edn_string)

    # Convert to Python native types
    python_data = edn_to_python(edn_data)

    # Convert to JSON
    return json.dumps(python_data)

def edn_to_json_object(edn_data):
    """
    Convert parsed EDN data to JSON-compatible Python objects.
    """
    return edn_to_python(edn_data)

# Example usage
if __name__ == "__main__":
    # Example EDN data
    edn_data = """{
        :name "John"
        :age 30
        :is-active true
        :tags #{:developer :python :clojure}
        :metadata {:created #inst "2023-01-01T00:00:00Z"
                  :updated nil}
        :friends [{:name "Alice" :age 28}
                 {:name "Bob" :age 32}]
    }"""

    # Convert to JSON
    json_str = edn_string_to_json(edn_data)
    print(json_str)

    # Or get Python objects directly
    python_obj = edn_to_json_object(loads(edn_data))
    print(python_obj)
