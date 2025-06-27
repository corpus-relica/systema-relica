#!/usr/bin/env python3
"""
Proxy wrapper for Socket.IO Aperture client to match the interface expected by NOUS tools.
This bridges the Socket.IO client with the tool interface.
"""

import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class ApertureSocketIOProxy:
    """
    Proxy that wraps the Socket.IO aperture client to provide the interface expected by tools.
    Automatically injects user_id and env_id into all calls.
    """
    
    def __init__(self, socketio_client, user_id: str, env_id: str):
        self.client = socketio_client
        self.user_id = user_id
        self.env_id = env_id
        
    async def textSearchLoad(self, search_term: str) -> Dict[str, Any]:
        """Search for entities by text and load them into the environment"""
        try:
            logger.info(f"Proxy textSearchLoad: term='{search_term}', user={self.user_id}, env={self.env_id}")
            
            # Use the Socket.IO client's send_request method with the correct action from contracts
            result = await self.client.send_request("aperture.search/load-text", {
                "userId": int(self.user_id),
                "term": search_term
            })
            
            logger.info(f"textSearchLoad result: {result}")
            environment = result.get('environment', result)
            return environment #result.get('payload', result) if result else {"facts": []}
            
        except Exception as e:
            logger.error(f"Error in textSearchLoad: {e}")
            return {"error": str(e)}
    
    async def uidSearchLoad(self, search_uid: int) -> Dict[str, Any]:
        """Search for entity by UID and load it into the environment"""
        try:
            logger.info(f"Proxy uidSearchLoad: uid={search_uid}, user={self.user_id}, env={self.env_id}")
            
            result = await self.client.send_request("aperture.search/load-uid", {
                "userId": self.user_id,
                "uid": search_uid
            })
            
            return result.get('payload', result) if result else {"facts": []}
            
        except Exception as e:
            logger.error(f"Error in uidSearchLoad: {e}")
            return {"error": str(e)}
    
    async def loadSpecializationFact(self, uid: int) -> Dict[str, Any]:
        """Load specialization fact (supertypes) for an entity"""
        try:
            result = await self.client.send_request("aperture.specialization/load-fact", {
                "userId": self.user_id,
                "environmentId": self.env_id,
                "uid": uid
            })
            return result.get('payload', result) if result else {"facts": []}
        except Exception as e:
            logger.error(f"Error in loadSpecializationFact: {e}")
            return {"error": str(e)}
    
    async def loadSpecializationHierarchy(self, uid: int) -> Dict[str, Any]:
        """Load full specialization hierarchy for an entity"""
        try:
            result = await self.client.send_request("aperture.specialization/load", {
                "userId": self.user_id,
                "environmentId": self.env_id,
                "uid": uid
            })
            return result.get('payload', result) if result else {"facts": []}
        except Exception as e:
            logger.error(f"Error in loadSpecializationHierarchy: {e}")
            return {"error": str(e)}
    
    async def loadSubtypes(self, uid: int) -> Dict[str, Any]:
        """Load direct subtypes of an entity"""
        try:
            print("STILL LOADING SUBTYPE", uid)
            result = await self.client.send_request("aperture.subtype/load", {
                "userId": self.user_id,
                "environmentId": self.env_id,
                "uid": uid
            })
            print("LOADED SUPTYPES", result)
            return result.get('payload', result) if result else {"facts": []}
        except Exception as e:
            logger.error(f"Error in loadSubtypes: {e}")
            return {"error": str(e)}
    
    async def loadClassificationFact(self, uid: int) -> Dict[str, Any]:
        """Load classification fact for an individual"""
        try:
            result = await self.client.send_request("aperture.classification/load-fact", {
                "userId": self.user_id,
                "environmentId": self.env_id,
                "uid": uid
            })
            return result.get('payload', result) if result else {"facts": []}
        except Exception as e:
            logger.error(f"Error in loadClassificationFact: {e}")
            return {"error": str(e)}
    
    async def loadClassified(self, uid: int) -> Dict[str, Any]:
        """Load individuals classified by a kind"""
        try:
            result = await self.client.send_request("aperture.classification/load", {
                "userId": self.user_id,
                "environmentId": self.env_id,
                "uid": uid
            })
            return result.get('payload', result) if result else {"facts": []}
        except Exception as e:
            logger.error(f"Error in loadClassified: {e}")
            return {"error": str(e)}
    
    async def loadAllRelatedFacts(self, uid: int) -> Dict[str, Any]:
        """Load all facts related to an entity"""
        try:
            result = await self.client.send_request("aperture.facts/load-all-related", {
                "userId": self.user_id,
                "environmentId": self.env_id,
                "uid": uid
            })
            return result.get('payload', result) if result else {"facts": []}
        except Exception as e:
            logger.error(f"Error in loadAllRelatedFacts: {e}")
            return {"error": str(e)}
    
    async def loadRequiredRoles(self, uid: int) -> Dict[str, Any]:
        """Load required roles for a relation"""
        try:
            result = await self.client.send_request("aperture.relation/required-roles-load", {
                "userId": self.user_id,
                "environmentId": self.env_id,
                "uid": uid
            })
            return result.get('payload', result) if result else {"facts": []}
        except Exception as e:
            logger.error(f"Error in loadRequiredRoles: {e}")
            return {"error": str(e)}
    
    async def loadRolePlayers(self, uid: int) -> Dict[str, Any]:
        """Load role players for a relation"""
        try:
            result = await self.client.send_request("aperture.relation/role-players-load", {
                "userId": self.user_id,
                "environmentId": self.env_id,
                "uid": uid
            })
            return result.get('payload', result) if result else {"facts": []}
        except Exception as e:
            logger.error(f"Error in loadRolePlayers: {e}")
            return {"error": str(e)}
    
    async def selectEntity(self, uid: int) -> Dict[str, Any]:
        """Select an entity as the current focus"""
        try:
            result = await self.client.send_request("aperture.entity/select", {
                "userId": self.user_id,
                "entityUid": uid,
                "environmentId": self.env_id
            })
            return result.get('payload', result) if result else {}
        except Exception as e:
            logger.error(f"Error in selectEntity: {e}")
            return {"error": str(e)}