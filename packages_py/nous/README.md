# NOUS Service

NOUS is the AI/ML inference and reasoning service for Systema Relica. It provides intelligent analysis and language processing capabilities through a Socket.IO-based real-time interface.

## Architecture

The service has been refactored for clarity and maintainability with the following structure:

```
src/
├── agent/          # Core agent logic
│   ├── nous_agent.py    # Main NOUS agent implementation
│   └── tools.py         # LangChain tools for agent operations
├── models/         # Domain models
│   └── semantic_model.py # Semantic model for knowledge representation
├── clients/        # Socket.IO client implementations
│   ├── base.py          # Base Socket.IO client class
│   ├── aperture.py      # Aperture service client
│   ├── archivist.py     # Archivist service client
│   └── clarity.py       # Clarity service client
├── proxies/        # Agent proxy wrappers
│   ├── aperture_proxy.py  # Aperture client proxy for agent
│   └── archivist_proxy.py # Archivist client proxy for agent
├── server/         # Socket.IO server
│   └── socketio_server.py # NOUS Socket.IO server implementation
├── utils/          # Utilities
│   └── event_emitter.py   # Event handling utility
└── config.py       # Configuration management
```

## Running the Service

```bash
python main.py
```

The service will start on port 3006 by default (configurable via NOUS_PORT environment variable).

## Configuration

Configuration is managed through environment variables loaded from the monorepo's root `.env` file. Key settings include:

- `NOUS_PORT`: Service port (default: 3006)
- `APERTURE_URL`: Aperture service URL
- `ARCHIVIST_URL`: Archivist service URL
- `CLARITY_URL`: Clarity service URL
- `DEFAULT_ENVIRONMENT_ID`: Default environment to load on startup

## Communication

NOUS communicates with other services via Socket.IO:
- Receives user input via its Socket.IO server
- Connects to Aperture, Archivist, and Clarity services as a Socket.IO client
- Processes requests using LangChain-based AI agents
- Returns responses in real-time

## Development

### Adding New Tools

To add new agent tools, modify `src/agent/tools.py` and add your tool function to the `create_agent_tools` function.

### Testing

Run tests with:
```bash
pytest
```