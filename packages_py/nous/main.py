# import asyncio
# import logging
# import sys
# import traceback

# # Set up logging - suppress EDN format logs
# logging.basicConfig(level=logging.INFO)
# logging.getLogger("edn_format").setLevel(logging.WARNING)  # Suppress EDN logs
# logger = logging.getLogger("nous_main")

# # Import the WebSocketServer for the Uvicorn app
# from src.meridian.server import WebSocketServer, app

# # Import client implementations - make sure these paths match your project structure
# from src.relica_nous_langchain.services.clarity_client import clarity_client
# from src.relica_nous_langchain.services.aperture_client import aperture_client
# from src.relica_nous_langchain.services.NOUSServer import nous_server

# async def main():
#     print("RELICA :: NOUS :: STARTING UP....")
#     print("!!!!!!!!!!!!!!!!!11 DEBUG MESSAGE !!!!!!!!!!!!!!!!!!!!!!1")

#     # Initialize the NOUS server
#     async def handle_user_input(input):
#         logger.info(f"Processing user input: {input}")
#         # Add your processing logic here

#     print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
#     # Initialize the server
#     nous_server.init(handle_user_input)

#     # Connect to services
#     print("About to connect to Clarity")
#     clarity_connected = await clarity_client.connect()
#     print(f"Clarity connection status: {clarity_connected}")

#     print("About to connect to Aperture")
#     aperture_connected = await aperture_client.connect()
#     print(f"Aperture connection status: {aperture_connected}")

#     # Check connections before retrieving environment
#     print("After connection checks")
#     if aperture_connected:
#         print("Aperture connected, about to call retrieveEnvironment()")
#         sys.stdout.flush()  # Force output to flush
#         try:
#             print("Calling retrieveEnvironment...")
#             env = await aperture_client.retrieveEnvironment(7, None)
#             print("Received environment response")
#             print(f"Environment data received: {env is not None}")
#             if env:
#                 # Process environment data here
#                 print(f"Environment data: {env}")
#             else:
#                 print("No environment data received")
#         except Exception as e:
#             print(f"Error retrieving environment: {e}")
#             traceback.print_exc()
#     else:
#         print("Cannot retrieve environment - Aperture not connected")

#     print("All startup tasks completed, waiting for events...")

#     # Create a never-ending future to keep the program running
#     never_ending = asyncio.Future()
#     try:
#         await never_ending
#     except asyncio.CancelledError:
#         print("Main future was cancelled")

# if __name__ == "__main__":
#     import uvicorn
#     import threading

#     # Start the uvicorn server in a separate thread
#     server_thread = threading.Thread(
#         target=uvicorn.run,
#         kwargs={"app": app, "host": "0.0.0.0", "port": 2204},
#         daemon=True
#     )
#     server_thread.start()

#     try:
#         # Run the asyncio event loop for our main function
#         print("About to run main")
#         asyncio.run(main())
#     except KeyboardInterrupt:
#         print("Keyboard interrupt received, shutting down")
#     except Exception as e:
#         print(f"ERROR IN MAIN: {e}")
#         traceback.print_exc()
#     finally:
#         print("Exiting program")

import asyncio
import logging
from src.relica_nous_langchain.services.NOUSServer import nous_server
from src.relica_nous_langchain.services.aperture_client import aperture_client
from src.relica_nous_langchain.services.clarity_client import clarity_client

from src.meridian.server import WebSocketServer, app

from src.relica_nous_langchain.test_agent import graph, get_response
# from src.relica_nous_langchain.compere.NOUSCompere import nousCompere
from src.relica_nous_langchain.SemanticModel import semantic_model

# Set up logging - suppress EDN format logs
logging.basicConfig(level=logging.INFO)
logging.getLogger("edn_format").setLevel(logging.WARNING)  # Suppress EDN logs

# from dotenv import load_dotenv
# load_dotenv()  # This loads the variables from .env

# #####################################################################################

async def main():
    print("RELICA :: NOUS :: STARTING UP....")



    def handleChatHistory(chatHistory):
        print("HANDLE CHAT HISTORY")
        nous_server.sendChatHistory(chatHistory)
    def handleFinalAnswer(finalAnswer):
        print("HANDLE FINAL ANSWER")
        nous_server.sendFinalAnswer(finalAnswer)

#     nousCompere.emitter.on('chatHistory', handleChatHistory)
#     nousCompere.emitter.on('final_answer', handleFinalAnswer)

    async def retrieveEnv():
        # print('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
        try:
            result = await aperture_client.retrieveEnvironment(7, None)
            print("*******************************************")

            env = result['environment']
            facts = env['facts']

            await semantic_model.addFacts(facts)
            semantic_model.selected_entity = env['selected_entity_id']

            return env
        except Exception as e:
            print(f"Error retrieving environment: {e}")
            return None

    async def handle_user_input(input: str):
        print(f"Processing user input NUKKAH: {input}")
        foo = await get_response(input)
        print(f"RESPONSE: {foo}")
        await nous_server.send_final_answer({'message': foo})
#     async def handleUserInput(input: str):
#         res = await nousCompere.handleInput(input)
#         return res

    print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")

    # Initialize the server
    nous_server.init(handle_user_input)

    # Connect to services
    clarity_connected = await clarity_client.connect()
    print(f"Clarity connection status: {clarity_connected}")

    aperture_connected = await aperture_client.connect()
    print(f"Aperture connection status: {aperture_connected}")

    # Check connections before retrieving environment
    if aperture_connected:
        env = await retrieveEnv()
        print(f">>>>>>>>>> Retrieved environment: {env is not None}")
    else:
        print("Cannot retrieve environment - Aperture not connected")

    # Keep the main task running to prevent program termination
    await asyncio.Future()  # This keeps the event loop running


if __name__ == "__main__":
    import uvicorn

    # Start the uvicorn server in a separate thread
    import threading
    threading.Thread(
        target=uvicorn.run,
        kwargs={"app": app, "host": "0.0.0.0", "port": 2204},
        daemon=True
    ).start()

    # Run the asyncio event loop for our main function
    asyncio.run(main())
