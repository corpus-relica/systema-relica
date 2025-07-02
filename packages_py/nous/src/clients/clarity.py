import os
import logging
from typing import List, Dict, Any, Optional
from .base import BaseSocketIOClient

logger = logging.getLogger('clarity-client')

class ClarityClient(BaseSocketIOClient):
    """Socket.IO client for Clarity service"""
    
    def __init__(self):
        host = os.getenv('CLARITY_HOST', 'localhost')
        port = int(os.getenv('CLARITY_PORT', '3001'))
        super().__init__('clarity', host, port)
    
    async def transform_model(self, transformation_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Apply semantic model transformation"""
        return await self.send_request('transform-model', {
            'transformationType': transformation_type,
            'parameters': params
        })
    
    async def get_model_state(self) -> Dict[str, Any]:
        """Get current semantic model state"""
        return await self.send_request('get-model-state', {})
    
    async def validate_model(self) -> Dict[str, Any]:
        """Validate the current semantic model"""
        return await self.send_request('validate-model', {})
    
    async def get_concept_definition(self, concept_uid: str) -> Dict[str, Any]:
        """Get definition for a concept"""
        return await self.send_request('get-concept-definition', {'conceptUid': concept_uid})
    
    async def generate_textual_definition(self, concept_uid: str) -> str:
        """Generate textual definition for a concept using AI"""
        response = await self.send_request('generate-textual-definition', {'conceptUid': concept_uid})
        return response.get('definition', '')
    
    async def infer_relationships(self, entity_uid: str) -> List[Dict[str, Any]]:
        """Infer possible relationships for an entity"""
        return await self.send_request('infer-relationships', {'entityUid': entity_uid})
    
    async def classify_entity(self, entity_description: str) -> Dict[str, Any]:
        """Classify an entity based on description"""
        return await self.send_request('classify-entity', {'description': entity_description})
    
    async def suggest_facts(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Suggest relevant facts based on context"""
        return await self.send_request('suggest-facts', {'context': context})
    
    async def semantic_search(self, query: str, context: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Perform semantic search"""
        payload = {'query': query}
        if context:
            payload['context'] = context
        return await self.send_request('semantic-search', payload)
    
    async def update_model_cache(self) -> bool:
        """Update the semantic model cache"""
        try:
            await self.send_request('update-model-cache', {})
            return True
        except Exception as e:
            logger.error(f"Failed to update model cache: {e}")
            return False

# Create singleton instance
clarity_client = ClarityClient()