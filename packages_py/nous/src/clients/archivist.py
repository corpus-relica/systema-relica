import os
import logging
from typing import List, Dict, Any, Optional
from .base import BaseSocketIOClient

logger = logging.getLogger('archivist-client')

class ArchivistClient(BaseSocketIOClient):
    """Socket.IO client for Archivist service"""
    
    def __init__(self):
        host = os.getenv('ARCHIVIST_HOST', 'localhost')
        port = int(os.getenv('ARCHIVIST_PORT', '3000'))
        super().__init__('archivist', host, port)
    
    async def get_kinds(self) -> List[Dict[str, Any]]:
        """Get all kinds from the semantic model"""
        return await self.send_request('get-kinds', {})
    
    async def get_entities_by_kind(self, kind: str) -> List[Dict[str, Any]]:
        """Get entities by kind"""
        return await self.send_request('get-entities-by-kind', {'kind': kind})
    
    async def get_entity_by_uid(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get entity by UID"""
        try:
            return await self.send_request('get-entity-by-uid', {'uid': uid})
        except Exception as e:
            logger.warning(f"Entity not found: {uid} - {e}")
            return None
    
    async def search_entities(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Search entities by text"""
        return await self.send_request('search-entities', {'query': query, 'limit': limit})
    
    async def get_facts_for_entity(self, entity_uid: str) -> List[Dict[str, Any]]:
        """Get all facts for an entity"""
        return await self.send_request('get-facts-for-entity', {'entityUid': entity_uid})
    
    async def get_related_entities(self, entity_uid: str, relationship_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get entities related to the given entity"""
        payload = {'entityUid': entity_uid}
        if relationship_type:
            payload['relationshipType'] = relationship_type
        return await self.send_request('get-related-entities', payload)
    
    async def create_fact(self, lh_object_uid: str, rel_type_uid: str, rh_object_uid: str) -> Dict[str, Any]:
        """Create a new fact"""
        return await self.send_request('create-fact', {
            'lhObjectUid': lh_object_uid,
            'relTypeUid': rel_type_uid,
            'rhObjectUid': rh_object_uid
        })
    
    async def delete_fact(self, fact_uid: str) -> bool:
        """Delete a fact"""
        try:
            await self.send_request('delete-fact', {'factUid': fact_uid})
            return True
        except Exception as e:
            logger.error(f"Failed to delete fact {fact_uid}: {e}")
            return False
    
    async def get_specialization_hierarchy(self, root_uid: Optional[str] = None) -> Dict[str, Any]:
        """Get specialization hierarchy"""
        payload = {}
        if root_uid:
            payload['rootUid'] = root_uid
        return await self.send_request('get-specialization-hierarchy', payload)
    
    async def get_fact_subtypes(self, fact_type_uid: str) -> List[Dict[str, Any]]:
        """Get subtypes of a fact type"""
        return await self.send_request('get-fact-subtypes', {'factTypeUid': fact_type_uid})

    # async def get_subtypes(self, uid: int):
    #     """Get subtypes of a kind"""
    #     try:
    #         print("STILL GETTING SUBTYPES")
    #         result = await self.client.send_request("fact:getSubtypes", {
    #             "uid": uid
    #         })

    #         print("GOT SUBTYPES INNER")
    #         return result
    #     except Exception as e:
    #         return [f"Error getting subntypes: {str(e)}"]
# Create singleton instance
archivist_client = ArchivistClient()