# Python Testing Strategy & Framework Documentation

## 🎯 **Overview**

This document outlines the comprehensive testing strategy, framework, and best practices for the Python components in the `packages_py/nous/` directory. The testing infrastructure is designed to ensure high-quality, reliable code through systematic testing approaches.

## 🏗️ **Testing Architecture**

### **Framework Foundation**
- **Primary Framework**: pytest 8.0+
- **Async Testing**: pytest-asyncio for WebSocket and async operations
- **Coverage Analysis**: pytest-cov with 80% minimum threshold
- **Mock Infrastructure**: Built-in unittest.mock with custom WebSocket utilities

### **Directory Structure**
```
packages_py/nous/tests/
├── __init__.py                 # Test package initialization
├── conftest.py                 # Shared fixtures and configuration
├── unit/                       # Unit tests for individual components
│   ├── test_semantic_model.py  # SemanticModel class testing
│   ├── test_message_format.py  # Message format validation
│   ├── test_aperture_client.py # Aperture service client
│   ├── test_archivist_client.py# Archivist service client
│   ├── test_clarity_client.py  # Clarity service client
│   ├── test_nous_server.py     # NOUS server functionality
│   └── test_tools_prebuilt.py  # Prebuilt tools testing
├── integration/                # Integration tests
│   ├── test_end_to_end_scenarios.py
│   ├── test_langchain_agent_integration.py
│   └── test_nous_websocket_integration.py
├── websocket/                  # WebSocket-specific tests
│   ├── test_websocket_protocols.py
│   └── test_websocket_server.py
└── utils/                      # Testing utilities
    └── websocket_utils.py      # WebSocket testing framework
```

## 🧪 **Testing Categories**

### **1. Unit Tests**
**Purpose**: Test individual components in isolation
**Location**: `tests/unit/`
**Scope**: Single functions, classes, or modules
**Dependencies**: Mocked external services

**Key Areas**:
- **SemanticModel**: Core semantic processing logic
- **Message Format**: WebSocket message validation and serialization
- **Service Clients**: Aperture, Archivist, and Clarity client functionality
- **NOUS Server**: Server initialization and request handling
- **Tools**: Prebuilt tool implementations

### **2. Integration Tests**
**Purpose**: Test component interactions and workflows
**Location**: `tests/integration/`
**Scope**: Multi-component scenarios
**Dependencies**: Mock services with realistic data flows

**Key Areas**:
- **End-to-End Scenarios**: Complete user workflows
- **LangChain Agent Integration**: Agent-to-service communication
- **WebSocket Integration**: Real-time communication flows

### **3. WebSocket Tests**
**Purpose**: Test async WebSocket communication
**Location**: `tests/websocket/`
**Scope**: WebSocket protocols and server behavior
**Dependencies**: Mock WebSocket servers and clients

**Key Areas**:
- **Protocol Validation**: Message format compliance
- **Connection Management**: Connect, disconnect, reconnect scenarios
- **Error Handling**: Network failures and recovery

## ⚙️ **Configuration Files**

### **pytest.ini**
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --verbose
    --tb=short
    --cov=src
    --cov-report=html:htmlcov
    --cov-report=xml:coverage.xml
    --cov-report=json:coverage.json
    --cov-report=term-missing
    --cov-fail-under=80
    --asyncio-mode=auto
markers =
    unit: Unit tests
    integration: Integration tests
    websocket: WebSocket tests
    async: Async tests
    slow: Slow tests
```

### **.coveragerc**
```ini
[run]
source = src
omit = 
    */tests/*
    */test_*
    */__pycache__/*
    */venv/*
    */env/*

[report]
fail_under = 80
show_missing = true
skip_covered = false

[html]
directory = htmlcov

[xml]
output = coverage.xml

[json]
output = coverage.json
```

## 🔧 **Testing Utilities**

### **WebSocket Testing Framework**
**File**: `tests/utils/websocket_utils.py`

**Key Components**:
- **MockWebSocketServer**: Simulates WebSocket server behavior
- **MockWebSocketClient**: Simulates client connections
- **Message Validators**: Ensures message format compliance
- **Async Test Helpers**: Utilities for async test scenarios

**Usage Example**:
```python
from tests.utils.websocket_utils import MockWebSocketServer, create_test_message

async def test_websocket_communication():
    server = MockWebSocketServer()
    await server.start()
    
    message = create_test_message("test_action", {"key": "value"})
    response = await server.send_message(message)
    
    assert response["status"] == "success"
    await server.stop()
```

### **Service Client Mocking**
**File**: `tests/conftest.py`

**Available Fixtures**:
- `mock_aperture_client`: Mocked Aperture service client
- `mock_archivist_client`: Mocked Archivist service client  
- `mock_clarity_client`: Mocked Clarity service client
- `sample_semantic_data`: Test data for semantic operations
- `websocket_test_server`: WebSocket server for testing

## 🚀 **Running Tests**

### **Basic Test Execution**
```bash
# Run all tests
pytest

# Run specific test category
pytest -m unit
pytest -m integration
pytest -m websocket

# Run specific test file
pytest tests/unit/test_semantic_model.py

# Run with coverage report
pytest --cov=src --cov-report=html
```

### **Advanced Options**
```bash
# Run tests in parallel
pytest -n auto

# Run only failed tests
pytest --lf

# Run tests with detailed output
pytest -v -s

# Run slow tests
pytest -m slow

# Skip slow tests
pytest -m "not slow"
```

## 📊 **Coverage Requirements**

### **Minimum Thresholds**
- **Overall Coverage**: 80% minimum
- **Unit Tests**: 90% minimum for core components
- **Integration Tests**: 70% minimum for workflows
- **WebSocket Tests**: 85% minimum for communication protocols

### **Coverage Reporting**
- **HTML Report**: `htmlcov/index.html` - Interactive coverage browser
- **XML Report**: `coverage.xml` - CI/CD integration
- **JSON Report**: `coverage.json` - Programmatic analysis
- **Terminal Report**: Real-time coverage feedback

### **Coverage Exclusions**
- Test files themselves
- Development utilities
- External library interfaces
- Platform-specific code blocks

## 🔍 **Testing Best Practices**

### **Test Design Principles**
1. **Isolation**: Each test should be independent
2. **Repeatability**: Tests should produce consistent results
3. **Fast Execution**: Unit tests should complete quickly
4. **Clear Assertions**: Test outcomes should be obvious
5. **Comprehensive Coverage**: Test both success and failure paths

### **Naming Conventions**
```python
# Test files
test_component_name.py

# Test classes
class TestComponentName:

# Test methods
def test_method_name_expected_behavior():
def test_method_name_with_invalid_input_raises_error():
def test_method_name_when_condition_then_outcome():
```

### **Mock Strategy**
- **External Services**: Always mock external API calls
- **WebSocket Connections**: Use mock servers for testing
- **File System**: Mock file operations for unit tests
- **Time-Dependent Code**: Mock datetime for consistent results

### **Async Testing Patterns**
```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    result = await async_function()
    assert result is not None

@pytest.mark.websocket
async def test_websocket_connection():
    async with websocket_client() as client:
        await client.send("test message")
        response = await client.receive()
        assert response["status"] == "ok"
```

## 🔄 **Continuous Integration**

### **Pre-commit Hooks**
```bash
# Install pre-commit hooks
pre-commit install

# Run tests before commit
pytest --cov=src --cov-fail-under=80
```

### **CI/CD Pipeline Integration**
```yaml
# Example GitHub Actions workflow
- name: Run Python Tests
  run: |
    cd packages_py/nous
    pip install -r requirements.txt
    pytest --cov=src --cov-report=xml --cov-fail-under=80
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./packages_py/nous/coverage.xml
```

## 🐛 **Debugging Test Failures**

### **Common Issues**
1. **Port Conflicts**: WebSocket tests failing due to port already in use
   - **Solution**: Use dynamic port allocation in test fixtures

2. **Async Timing Issues**: Race conditions in async tests
   - **Solution**: Use proper await patterns and timeouts

3. **Mock Configuration**: Incorrect mock setup causing false positives
   - **Solution**: Verify mock call patterns and return values

4. **Coverage Gaps**: Missing coverage in critical paths
   - **Solution**: Add tests for error conditions and edge cases

### **Debugging Commands**
```bash
# Run tests with debugging output
pytest -v -s --tb=long

# Run specific failing test
pytest tests/unit/test_component.py::test_specific_method -v

# Run tests with pdb debugger
pytest --pdb

# Show test coverage gaps
pytest --cov=src --cov-report=term-missing
```

## 📈 **Performance Testing**

### **Test Performance Monitoring**
- **Unit Tests**: Should complete in <1 second each
- **Integration Tests**: Should complete in <10 seconds each
- **Full Test Suite**: Should complete in <2 minutes

### **Performance Markers**
```python
@pytest.mark.slow
def test_heavy_computation():
    # Tests that take longer than normal
    pass

@pytest.mark.performance
def test_response_time():
    # Tests that measure performance metrics
    pass
```

## 🔮 **Future Enhancements**

### **Planned Improvements**
1. **Property-Based Testing**: Using Hypothesis for edge case discovery
2. **Load Testing**: WebSocket connection stress testing
3. **Security Testing**: Input validation and injection testing
4. **Performance Benchmarking**: Automated performance regression detection
5. **Visual Testing**: UI component testing for web interfaces

### **Tool Integration**
- **Mutation Testing**: Using mutmut for test quality assessment
- **Static Analysis**: Integration with mypy and pylint
- **Documentation Testing**: Docstring example validation
- **API Contract Testing**: OpenAPI specification validation

---

## 📚 **References**

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio Documentation](https://pytest-asyncio.readthedocs.io/)
- [Coverage.py Documentation](https://coverage.readthedocs.io/)
- [WebSocket Testing Patterns](https://websockets.readthedocs.io/en/stable/howto/test.html)

---

**Last Updated**: May 30, 2025  
**Version**: 1.0  
**Maintainer**: Python Testing Infrastructure Team