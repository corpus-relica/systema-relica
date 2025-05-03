from rich import print
import asyncio
import logging
from src.relica_nous_langchain.services.NOUSServer import nous_server
from src.relica_nous_langchain.services.aperture_client import aperture_client, ApertureClientProxy
from src.relica_nous_langchain.services.archivist_client import archivist_client
from src.relica_nous_langchain.services.clarity_client import clarity_client

from src.meridian.server import WebSocketServer, app

# from src.relica_nous_langchain.test_agent import handleInput
# from src.relica_nous_langchain.agent.NOUSAgent import NOUSAgent
from src.relica_nous_langchain.agent.NOUSAgentPrebuilt import NOUSAgent
# from src.relica_nous_langchain.agent.NOUSAgent_prebuilt import handleInput
from src.relica_nous_langchain.agent.Tools import create_agent_tools

# from src.relica_nous_langchain.compere.NOUSCompere import nousCompere
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

#     nousCompere.emitter.on('chatHistory', handleChatHistory)
#    nous_server.emitter.on('final_answer', handleFinalAnswer)

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

    async def handle_user_input(user_id, env_id, message, client_id: str):
        """Handle user input received via WebSocket."""
        logger = logging.getLogger(__name__)
        logger.info(f"Handling input for user '{user_id}', env '{env_id}', client '{client_id}': '{message}'")

        # Create an ApertureClientProxy instance for this specific user/environment context
        aperture_proxy = ApertureClientProxy(user_id=user_id, env_id=env_id)

        # 1. Generate the tools and metadata using the factory and the user-specific proxy
        tool_data = create_agent_tools(aperture_proxy=aperture_proxy)

        # 2. Instantiate the NOUSAgent
        #    (Adjust constructor arguments if NOUSAgent expects different names/structure)
        agent = NOUSAgent(
            aperture_client=aperture_proxy, # Pass the proxy
            tools=tool_data["tools"], # Based on thoughtNode.py usage
            tool_descriptions=tool_data["tool_descriptions"], # Based on thoughtNode.py usage
            tool_names=tool_data["tool_names"], # Based on thoughtNode.py usage
            semantic_model=semantic_model, # Pass the imported semantic_model instance
            converted_tools=tool_data["converted_tools"], # Pass the converted_tools from tool_data
            # Pass other necessary dependencies for NOUSAgent here, if any
            # e.g., nous_server=nous_server ?
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
        kwargs={"app": app, "host": "0.0.0.0", "port": 2204},
        daemon=True
    ).start()

    # Run the asyncio event loop for our main function
    asyncio.run(main())
