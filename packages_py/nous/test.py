#!/usr/bin/env python3

import asyncio
import logging
import traceback

# Set up basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_aperture")

async def test():
    print("===== STARTING APERTURE TEST =====")

    # Import the aperture client directly
    from src.relica_nous_langchain.services.aperture_client import aperture_client

    print("Imported aperture_client")
    print("Connecting to Aperture...")

    connected = await aperture_client.connect()
    print(f"Connected: {connected}")

    if connected:
        print("About to call retrieveEnvironment...")
        try:
            env = await aperture_client.retrieveEnvironment(7, None)
            print(f"Environment retrieved: ...")
        except Exception as e:
            print(f"Error in retrieveEnvironment: {e}")
            traceback.print_exc()
    else:
        print("Failed to connect to Aperture")

    print("===== TEST COMPLETE =====")

if __name__ == "__main__":
    try:
        asyncio.run(test())
    except Exception as e:
        print(f"ERROR: {e}")
        traceback.print_exc()
