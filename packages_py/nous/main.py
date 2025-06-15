from rich import print
import asyncio
import logging
from src.relica_nous_langchain.services.NOUSServer import nous_server
from src.socketio_clients.aperture_client import aperture_client
from src.socketio_clients.archivist_client import archivist_client
from src.socketio_clients.clarity_client import clarity_client

from src.meridian.server import WebSocketServer, app

from src.relica_nous_langchain.agent.NOUSAgentPrebuilt import NOUSAgent
# from src.relica_nous_langchain.agent.ToolsPrebuilt import create_agent_tools

from src.relica_nous_langchain.SemanticModel import semantic_model

# Set up logging - suppress EDN format logs
logging.basicConfig(level=logging.INFO)
logging.getLogger("edn_format").setLevel(logging.WARNING)  # Suppress EDN logs

# from dotenv import load_dotenv
# load_dotenv()  # This loads the variables from .env

# #####################################################################################

messages = []

async def main():
    print("RELICA :: NOUS :: STARTING UP....")

    def handleChatHistory(chatHistory):
        print("HANDLE CHAT HISTORY")
        nous_server.sendChatHistory(chatHistory)
    def handleFinalAnswer(finalAnswer):
        print("HANDLE FINAL ANSWER")
        nous_server.sendFinalAnswer(finalAnswer)

    async def retrieveEnv():
        # print('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
        try:
            # Connect if not already connected
            if not aperture_client.is_connected():
                await aperture_client.connect()
            
            result = await aperture_client.retrieve_environment(1, None)
            print("*******************************************")
            print(result)

            env = result
            facts = env.get('facts', [])

            await semantic_model.addFacts(facts)
            semantic_model.selected_entity = env.get('selected_entity_id')

            return env
        except Exception as e:
            print(f"Error retrieving environment: {e}")
            return None

    async def handle_user_input(user_id, env_id, message, client_id: str):
        """Handle user input received via WebSocket."""
        logger = logging.getLogger(__name__)
        logger.info(f"Handling input for user '{user_id}', env '{env_id}', client '{client_id}': '{message}'")

        # Ensure clients are connected
        if not aperture_client.is_connected():
            await aperture_client.connect()
        if not archivist_client.is_connected():
            await archivist_client.connect()

        # 1. Generate the tools and metadata using the factory and the user-specific proxy
        # tool_data = create_agent_tools(aperture_proxy=aperture_proxy)

        # 2. Instantiate the NOUSAgent
        #    (Adjust constructor arguments if NOUSAgent expects different names/structure)
        agent = NOUSAgent(
            aperture_client=aperture_client, # Pass the Socket.IO client
            archivist_client=archivist_client,
            semantic_model=semantic_model, # Pass the imported semantic_model instance
        )


        # 3. Invoke the agent to process the input
        #    (Replace 'handleInput' with the actual method name if different)
        try:
            # Assuming the agent returns the final answer to send to the user
            messages.append({"role":"user", "content": message})
            final_answer_raw = await agent.handleInput(messages)
            final_answer = final_answer_raw.strip() if isinstance(final_answer_raw, str) else final_answer_raw
            messages.append({"role":"assistant", "content": final_answer})

            logger.info(f"Final answer: {final_answer}")
            logger.info(f"Agent processed message from user '{user_id}', sending response to client '{client_id}'.")
            # 4. Send the final answer back to the user
            #    (Adjust if nous_server needs different arguments or if agent handles sending)
            await nous_server.send_final_answer(client_id, final_answer)
        except Exception as e:
            logger.error(f"Agent processing failed for user '{user_id}', client '{client_id}': {e}", exc_info=True)
            # Optionally send an error message back to the user
            await nous_server.send_error_message(client_id, f"An error occurred: {e}")

    print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")

    # Initialize the server
    nous_server.init(handle_user_input)

    # Connect to services
    clarity_connected = await clarity_client.connect()
    print(f"Clarity connection status: {clarity_connected}")

    # Use the singleton aperture_client for connection
    aperture_connected = await aperture_client.connect()
    print(f"Aperture connection status: {aperture_connected}")

    # Check connections before retrieving environment
    if aperture_connected:
        # Call retrieveEnv which uses the singleton client
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
        kwargs={"app": app, "host": "0.0.0.0", "port": 3006},
        daemon=True
    ).start()

    # Run the asyncio event loop for our main function
    asyncio.run(main())
