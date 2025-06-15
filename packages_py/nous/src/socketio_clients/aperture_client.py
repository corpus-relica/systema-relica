import os
import logging
from typing import List, Dict, Any, Optional
from .base_client import BaseSocketIOClient

logger = logging.getLogger('aperture-client')

class ApertureClient(BaseSocketIOClient):
    """Socket.IO client for Aperture service"""
    
    def __init__(self):
        host = os.getenv('APERTURE_HOST', 'localhost')
        port = int(os.getenv('APERTURE_PORT', '3002'))
        super().__init__('aperture', host, port)
    
    async def retrieve_environment(self, environment_id: int, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Retrieve user environment"""
        payload = {'environmentId': environment_id}
        if user_id:
            payload['userId'] = user_id
        return await self.send_request('retrieve-environment', payload)
    
    async def create_environment(self, user_id: str, name: str) -> Dict[str, Any]:
        """Create a new environment"""
        return await self.send_request('create-environment', {
            'userId': user_id,
            'name': name
        })
    
    async def update_environment(self, environment_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update environment"""
        return await self.send_request('update-environment', {
            'environmentId': environment_id,
            'updates': updates
        })
    
    async def set_selected_entity(self, environment_id: int, entity_uid: str) -> bool:
        """Set selected entity in environment"""
        try:
            await self.send_request('set-selected-entity', {
                'environmentId': environment_id,
                'entityUid': entity_uid
            })
            return True
        except Exception as e:
            logger.error(f"Failed to set selected entity: {e}")
            return False
    
    async def get_selected_entity(self, environment_id: int) -> Optional[str]:
        """Get currently selected entity"""
        try:
            response = await self.send_request('get-selected-entity', {
                'environmentId': environment_id
            })
            return response.get('entityUid')
        except Exception as e:
            logger.warning(f"No selected entity: {e}")
            return None
    
    async def add_entity_to_environment(self, environment_id: int, entity_uid: str) -> bool:
        """Add entity to environment"""
        try:
            await self.send_request('add-entity-to-environment', {
                'environmentId': environment_id,
                'entityUid': entity_uid
            })
            return True
        except Exception as e:
            logger.error(f"Failed to add entity to environment: {e}")
            return False
    
    async def remove_entity_from_environment(self, environment_id: int, entity_uid: str) -> bool:
        """Remove entity from environment"""
        try:
            await self.send_request('remove-entity-from-environment', {
                'environmentId': environment_id,
                'entityUid': entity_uid
            })
            return True
        except Exception as e:
            logger.error(f"Failed to remove entity from environment: {e}")
            return False
    
    async def get_environment_entities(self, environment_id: int) -> List[Dict[str, Any]]:
        """Get all entities in environment"""
        return await self.send_request('get-environment-entities', {
            'environmentId': environment_id
        })
    
    async def clear_environment(self, environment_id: int) -> bool:
        """Clear all entities from environment"""
        try:
            await self.send_request('clear-environment', {
                'environmentId': environment_id
            })
            return True
        except Exception as e:
            logger.error(f"Failed to clear environment: {e}")
            return False
    
    async def get_user_environments(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all environments for a user"""
        return await self.send_request('get-user-environments', {
            'userId': user_id
        })

# Create singleton instance
aperture_client = ApertureClient()