import asyncio
import logging
from src.relica_nous_langchain.services.NOUSServer import NOUSServer
from src.relica_nous_langchain.services.aperture_client import ApertureClient
from src.relica_nous_langchain.services.clarity_client import ClarityClient

# from src.relica_nous_langchain.compere.NOUSCompere import nousCompere
# from src.relica_nous_langchain.SemanticModel import semanticModel

# Set up logging - suppress EDN format logs
logging.basicConfig(level=logging.INFO)
logging.getLogger("edn_format").setLevel(logging.WARNING)  # Suppress EDN logs

# from dotenv import load_dotenv
# load_dotenv()  # This loads the variables from .env

# #####################################################################################

async def main():
    print("RELICA :: NOUS :: STARTING UP....")

    async def handle_user_input(input):
        logger.info(f"Processing user input: {input}")

    clarity_client = ClarityClient()
    clarity_connected = await clarity_client.connect()

    aperture_client = ApertureClient()
    aperture_connected = await aperture_client.connect()

    server = NOUSServer()
    server.init(handle_user_input)

#     def handleChatHistory(chatHistory):
#         # print("HANDLE CHAT HISTORY")
#         browserComms.sendChatHistory(chatHistory)
#     def handleFinalAnswer(finalAnswer):
#         # print("HANDLE FINAL ANSWER")
#         browserComms.sendFinalAnswer(finalAnswer)

#     nousCompere.emitter.on('chatHistory', handleChatHistory)
#     nousCompere.emitter.on('final_answer', handleFinalAnswer)

    async def retrieveEnv():
        env = await aperture_client.retrieveEnvironment(7, None)
        print("ENVIRONMENT: ", env)
        # semanticModel.addFacts(env['facts'])
        # aperture_client.selectedEntity = env['selectedEntity']
        # semanticModel.addModels(env['models'])
    await retrieveEnv()

#     async def handleUserInput(input: str):
#         res = await nousCompere.handleInput(input)
#         return res

#     browserComms.init(handleUserInput=handleUserInput)
#     browserComms.start_server()
    await server.start_server()


if __name__ == "__main__":
    asyncio.run(main())
