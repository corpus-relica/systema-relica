#!/usr/bin/env python3
"""
Proxy wrapper for Socket.IO Archivist client to match the interface expected by NOUS tools.
"""

import logging
from typing import Optional, List

logger = logging.getLogger(__name__)

class ArchivistSocketIOProxy:
    """
    Proxy that wraps the Socket.IO archivist client to provide the interface expected by tools.
    """
    
    def __init__(self, socketio_client, user_id: str, env_id: str):
        self.client = socketio_client
        self.user_id = user_id
        self.env_id = env_id
        
    async def get_definition(self, uid: int) -> List[str]:
        """Get textual definition of an entity"""
        try:
            logger.info(f"Proxy get_definition: uid={uid}")
            
            # Use the Socket.IO client's send_request method
            result = await self.client.send_request("get-definition", {
                "uid": uid
            })

            return result
            
            # if isinstance(result, dict) and "definition" in result:
            #     # Return as list of strings (split by newlines if needed)
            #     definition = result["definition"]
            #     if isinstance(definition, str):
            #         return [definition]
            #     elif isinstance(definition, list):
            #         return definition
            #     else:
            #         return [str(definition)]
            # else:
            #     return ["No definition available"]
                
        except Exception as e:
            logger.error(f"Error in get_definition: {e}")
            return [f"Error retrieving definition: {str(e)}"]
    
    async def get_subtypes(self, uid: int):
        """Get subtypes of a kind"""
        try:
            print("STILL GETTING SUBTYPES")
            result = await self.client.send_request("fact:getSubtypes", {
                "uid": uid
            })

            print("GOT SUBTYPES INNER")
            return result
        except Exception as e:
            return [f"Error getting subntypes: {str(e)}"]