#!/usr/bin/env python3

from rich import print
import asyncio
import logging
import socketio
from aiohttp import web
from src.socketio_clients.aperture_client import aperture_client
from src.socketio_clients.archivist_client import archivist_client
from src.socketio_clients.clarity_client import clarity_client

from src.socketio_server import nous_socketio_server

from src.relica_nous_langchain.agent.NOUSAgentPrebuilt import NOUSAgent
from src.relica_nous_langchain.SemanticModel import semantic_model
from src.socketio_clients.aperture_proxy import ApertureSocketIOProxy
from src.socketio_clients.archivist_proxy import ArchivistSocketIOProxy

# Set up logging - suppress EDN format logs
logging.basicConfig(level=logging.INFO)
logging.getLogger("edn_format").setLevel(logging.WARNING)

messages = []

async def main():
    print("RELICA :: NOUS :: STARTING UP....")

    async def retrieveEnv():
        try:
            # Connect if not already connected
            if not aperture_client.is_connected():
                await aperture_client.connect()
            
            result = await aperture_client.retrieve_environment("bb121d97-1ab4-4cd3-bcb9-54459ad9b9b3", None)
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

        # 2. Create proxy clients for the agent using the existing Socket.IO connections
        aperture_proxy = ApertureSocketIOProxy(aperture_client, user_id, env_id)
        archivist_proxy = ArchivistSocketIOProxy(archivist_client, user_id, env_id)
        
        # 3. Instantiate the NOUSAgent
        agent = NOUSAgent(
            aperture_client=aperture_proxy,
            archivist_client=archivist_proxy,
            semantic_model=semantic_model,
            user_id=user_id,
            env_id=env_id
        )

        # 4. Invoke the agent to process the input
        try:
            # Assuming the agent returns the final answer to send to the user
            messages.append({"role":"user", "content": message})
            final_answer_raw = await agent.handleInput(messages)
            final_answer = final_answer_raw.strip() if isinstance(final_answer_raw, str) else final_answer_raw
            messages.append({"role":"assistant", "content": final_answer})

            logger.info(f"Final answer: {final_answer}")
            logger.info(f"Agent processed message from user '{user_id}', sending response to client '{client_id}'.")
            # 4. Send the final answer back to the user via Socket.IO
            await nous_socketio_server.send_final_answer(client_id, final_answer)
        except Exception as e:
            logger.error(f"Agent processing failed for user '{user_id}', client '{client_id}': {e}", exc_info=True)
            # Send error message via Socket.IO
            await nous_socketio_server.send_error_message(client_id, f"An error occurred: {e}")


    print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")

    # Register async handler with Socket.IO server
    nous_socketio_server.set_nous_handler(handle_user_input)

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
        print(f">>>>>>>>>> Retrieved environment - direct socketio: {env is not None}")
    else:
        print("Cannot retrieve environment - Aperture not connected")


if __name__ == "__main__":
    # Create aiohttp app for Socket.IO
    app = web.Application()
    
    # Attach Socket.IO to aiohttp app
    nous_socketio_server.sio.attach(app)
    
    async def init_app():
        # Start main async function
        asyncio.create_task(main())
        return app
    
    # Run aiohttp server
    web.run_app(init_app(), host='0.0.0.0', port=3006)