import asyncio
import logging
import edn_format
from ws_client import SenteClient

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("test-client")

async def main():
    # Define handlers
    def on_connect():
        logger.info("Connected to Sente server!")

    def on_disconnect():
        logger.info("Disconnected from Sente server")

    def on_message(event_type, payload):
        logger.info(f"Received message: {event_type} -> {payload}")

    # Create client with your actual port
    client = SenteClient(
        host="localhost",
        port=2175,  # Your actual port
        handlers={
            "on_connect": on_connect,
            "on_disconnect": on_disconnect,
            "on_message": on_message
        }
    )

    # Connect
    logger.info("Attempting to connect...")
    connected = await client.connect()

    if connected:
        logger.info("Successfully connected!")

        # Wait to ensure we've processed the handshake
        await asyncio.sleep(2)

        # Send a simple ping message
        logger.info("Sending ping message...")
        result = await client.send_message("ping", {"text": "Hello from Python!"})
        logger.info(f"Send result: {result}")

        # Wait for responses
        await asyncio.sleep(3)

        # Try match a broadcast test from your Clojure code
        logger.info("Sending test broadcast...")
        result = await client.send_message("test-broadcast", {
            "type": "test-broadcast",
            "message": "Hello from Python client!",
            "timestamp": "2023-03-09T12:34:56"
        })
        logger.info(f"Send result: {result}")

        # Wait for more responses
        await asyncio.sleep(5)

        # Disconnect
        logger.info("Disconnecting...")
        await client.disconnect()
    else:
        logger.error("Failed to connect!")

if __name__ == "__main__":
    asyncio.run(main())
