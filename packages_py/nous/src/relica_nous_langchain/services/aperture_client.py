import os
import logging
import asyncio
import websockets
import edn_format
from dotenv import load_dotenv
from ws_client import SenteClient

# Setup logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("aperture-client")

# Load environment variables
load_dotenv()
APERTURE_HOST = os.getenv("APERTURE_HOST", "localhost")
APERTURE_PORT = int(os.getenv("APERTURE_PORT", "2175"))

class ApertureClient:
    """
    Client for Aperture service - handles session management and environment functions
    """

    def __init__(self):
        logger.info(f"Initializing Aperture Client for {APERTURE_HOST}:{APERTURE_PORT}")
        self.client = None
        self.connected = False

    async def connect(self):
        """Connect to the Aperture service with more verbose error handling"""
        logger.info(f"Connecting to Aperture service at {APERTURE_HOST}:{APERTURE_PORT}")

        # First check if the service is reachable at all
        try:
            # Try a basic socket connection first to see if the port is open
            reader, writer = await asyncio.open_connection(APERTURE_HOST, APERTURE_PORT)
            writer.close()
            await writer.wait_closed()
            logger.info("Basic socket connection to Aperture succeeded")
        except Exception as e:
            logger.error(f"Failed to connect to Aperture service at {APERTURE_HOST}:{APERTURE_PORT}: {e}")
            logger.error("Check if Aperture is running and the port is correct")
            return False

        # Now try the WebSocket/Sente connection
        try:
            self.client = SenteClient(
                host=APERTURE_HOST,
                port=APERTURE_PORT,
                handlers={
                    "on_connect": self.on_connect,
                    "on_disconnect": self.on_disconnect,
                    "on_message": self.on_message
                }
            )

            # Register handlers for specific message types
            self.client.register_handler("environment-data", self.on_environment_data)
            self.client.register_handler("entity-data", self.on_entity_data)

            self.connected = await self.client.connect()

            if self.connected:
                logger.info("Successfully connected to Aperture via Sente")
                # Send a simple ping to verify the connection
                try:
                    result = await self.client.send_message("ping", {"hello": "from-nous"})
                    logger.debug(f"Ping result: {result}")
                except Exception as e:
                    logger.error(f"Failed to send initial ping: {e}")
            else:
                logger.error("Failed to establish Sente connection with Aperture")

            return self.connected

        except Exception as e:
            logger.error(f"Error connecting to Aperture: {e}", exc_info=True)
            self.connected = False
            return False

    async def disconnect(self):
        """Disconnect from the Aperture service"""
        if self.connected and self.client:
            await self.client.disconnect()
            self.connected = False

    # Sente client event handlers
    async def on_connect(self):
        """Handler for Sente connection established"""
        logger.info("Connected to Aperture service")
        self.connected = True

    async def on_disconnect(self):
        """Handler for Sente connection lost"""
        logger.info("Disconnected from Aperture service")
        self.connected = False
        # Try to reconnect after a delay
        await asyncio.sleep(5)
        await self.connect()

    async def on_message(self, event_type, payload):
        """Default handler for Sente messages"""
        logger.debug(f"Received message from Aperture: {event_type} - {payload}")

    async def on_environment_data(self, payload):
        """Handler for environment data updates"""
        logger.info("Received environment data update")
        return payload

    async def on_entity_data(self, payload):
        """Handler for entity data updates"""
        logger.info("Received entity data update")
        return payload

    # API methods
    async def retrieveEnvironment(self, user_id, environment_id):
        """Retrieve the current environment state"""
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!11   Retrieving environment")
        if not self.connected:
            logger.warning("Not connected to Aperture, trying to connect...")
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            # Create a payload with EDN keywords for keys
            payload = {
                edn_format.Keyword("user-id"): user_id,
                edn_format.Keyword("environment-id"): environment_id
            }

            response = await self.client.send_message(":environment/get", payload)
            return response
        except Exception as e:
            logger.error(f"Error retrieving environment: {e}")
            return {"error": f"Failed to retrieve environment: {str(e)}"}

    async def loadEntity(self, uid):
        """Load entity data by UID"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send_message("load-entity", {"uid": uid})
            return response
        except Exception as e:
            logger.error(f"Error loading entity: {e}")
            return {"error": f"Failed to load entity: {str(e)}"}

    async def loadEntity(self, uid):
        """Load entity data by UID"""
        if not self.connected:
            await self.connect()
            if not self.connected:
                return {"error": "Failed to connect to Aperture"}

        try:
            response = await self.client.send_message("load-entity", {"uid": uid})
            return response
        except Exception as e:
            logger.error(f"Error loading entity: {e}")
            return {"error": f"Failed to load entity: {str(e)}"}

# For testing directly
async def test_aperture_client():
    client = ApertureClient()
    connected = await client.connect()

    if connected:
        logger.info("Connection successful!")
        env = await client.retrieveEnvironment()
        logger.info(f"Environment: {env}")

        await client.disconnect()
    else:
        logger.error("Failed to connect to Aperture")

if __name__ == "__main__":
    asyncio.run(test_aperture_client())
