"""
Configuration module for NOUS service.
Loads configuration from environment variables.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from the monorepo root .env file
env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
load_dotenv(env_path)

# Service configuration
NOUS_PORT = int(os.getenv('NOUS_PORT', '3006'))
NOUS_HOST = '0.0.0.0'  # Bind to all interfaces

# Service URLs for inter-service communication
APERTURE_URL = os.getenv('APERTURE_URL', 'http://localhost:3002')
ARCHIVIST_URL = os.getenv('ARCHIVIST_URL', 'http://localhost:3000')
CLARITY_URL = os.getenv('CLARITY_URL', 'http://localhost:3001')

# WebSocket configuration
SOCKETIO_CORS_ORIGINS = '*'  # Configure based on your security needs
SOCKETIO_ASYNC_MODE = 'aiohttp'

# Logging configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# Default environment settings
DEFAULT_ENVIRONMENT_ID = os.getenv('DEFAULT_ENVIRONMENT_ID', 'bb121d97-1ab4-4cd3-bcb9-54459ad9b9b3')

# Concept placement category root UIDs
# TODO: Verify these UIDs match actual ontology structure
CATEGORY_ROOTS = {
    'physical object': 730044,  # placeholder - verify actual UID
    'aspect': 790229,          # placeholder - verify actual UID  
    'role': 160170,            # placeholder - verify actual UID
    'relation': 2850,          # placeholder - verify actual UID
    'state': 790123,             # placeholder - verify actual UID
    'occurrence': 193671,        # placeholder - verify actual UID
    'other': 730000           # fallback to 'anything' - verify actual UID
}