"""
Unit tests for SemanticModel class.

Tests the complete semantic model functionality including:
- Model and fact management (CRUD operations)
- Entity representation and formatting
- Relationship handling and organization
- Context generation for LLM interaction
- Orphaned model cleanup
- Error handling and edge cases
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json

from src.relica_nous_langchain.SemanticModel import SemanticModel


@pytest.mark.unit
@pytest.mark.asyncio
class TestSemanticModelInitialization:
    """Test SemanticModel initialization and basic properties."""
    
    def test_semantic_model_initialization(self):
        """Test basic semantic model initialization."""
        semantic_model = SemanticModel()
        
        # Verify initial state
        assert hasattr(semantic_model, '_facts')
        assert hasattr(semantic_model, '_models')
        assert hasattr(semantic_model, 'selected_entity')
        
        assert semantic_model._facts == []
        assert semantic_model._models == {}
        assert semantic_model.selected_entity is None
    
    def test_semantic_model_properties(self):
        """Test semantic model property accessors."""
        semantic_model = SemanticModel()
        
        # Test facts property
        assert semantic_model.facts == []
        assert semantic_model.facts is semantic_model._facts
        
        # Test models property
        assert semantic_model.models == {}
        assert semantic_model.models is semantic_model._models
        
        # Test selectedEntity property
        assert semantic_model.selectedEntity is None
    
    def test_semantic_context_property(self):
        """Test semantic context property."""
        semantic_model = SemanticModel()
        
        # Test semantic context (currently returns "foo")
        assert semantic_model.semanticContext == "foo"


@pytest.mark.unit
@pytest.mark.asyncio
class TestSemanticModelModelManagement:
    """Test SemanticModel model management operations."""
    
    def test_add_model_basic(self):
        """Test adding a single model."""
        semantic_model = SemanticModel()
        
        test_model = {
            'uid': '12345',
            'name': 'Test Entity',
            'type': 'kind',
            'category': 'concept'
        }
        
        semantic_model.addModel(test_model)
        
        # Verify model was added
        assert '12345' in semantic_model._models
        assert semantic_model._models['12345'] == test_model
        assert len(semantic_model._models) == 1
    
    def test_add_model_without_uid(self):
        """Test adding a model without UID (should be ignored)."""
        semantic_model = SemanticModel()
        
        test_model = {
            'name': 'Test Entity Without UID',
            'type': 'kind'
        }
        
        semantic_model.addModel(test_model)
        
        # Verify model was not added
        assert len(semantic_model._models) == 0
    
    def test_add_multiple_models(self):
        """Test adding multiple models."""
        semantic_model = SemanticModel()
        
        test_models = [
            {'uid': '11111', 'name': 'Entity 1', 'type': 'kind'},
            {'uid': '22222', 'name': 'Entity 2', 'type': 'individual'},
            {'uid': '33333', 'name': 'Entity 3', 'type': 'relation'}
        ]
        
        semantic_model.addModels(test_models)
        
        # Verify all models were added
        assert len(semantic_model._models) == 3
        assert '11111' in semantic_model._models
        assert '22222' in semantic_model._models
        assert '33333' in semantic_model._models
        
        for model in test_models:
            assert semantic_model._models[model['uid']] == model
    
    def test_add_models_with_duplicates(self):
        """Test adding models with duplicate UIDs (should overwrite)."""
        semantic_model = SemanticModel()
        
        # Add initial model
        initial_model = {'uid': '12345', 'name': 'Original', 'version': 1}
        semantic_model.addModel(initial_model)
        
        # Add updated model with same UID
        updated_model = {'uid': '12345', 'name': 'Updated', 'version': 2}
        semantic_model.addModel(updated_model)
        
        # Verify model was overwritten
        assert len(semantic_model._models) == 1
        assert semantic_model._models['12345'] == updated_model
        assert semantic_model._models['12345']['name'] == 'Updated'
    
    def test_remove_model(self):
        """Test removing a model."""
        semantic_model = SemanticModel()
        
        # Add test models
        test_models = [
            {'uid': '11111', 'name': 'Entity 1'},
            {'uid': '22222', 'name': 'Entity 2'},
            {'uid': '33333', 'name': 'Entity 3'}
        ]
        semantic_model.addModels(test_models)
        
        # Remove one model
        semantic_model.removeModel('22222')
        
        # Verify model was removed
        assert len(semantic_model._models) == 2
        assert '22222' not in semantic_model._models
        assert '11111' in semantic_model._models
        assert '33333' in semantic_model._models
    
    def test_remove_nonexistent_model(self):
        """Test removing a model that doesn't exist."""
        semantic_model = SemanticModel()
        
        # Try to remove non-existent model (should raise KeyError)
        with pytest.raises(KeyError):
            semantic_model.removeModel('nonexistent')


@pytest.mark.unit
@pytest.mark.asyncio
class TestSemanticModelFactManagement:
    """Test SemanticModel fact management operations."""
    
    @patch('src.relica_nous_langchain.SemanticModel.SemanticModel.loadModelsForFacts')
    async def test_add_fact_basic(self, mock_load_models):
        """Test adding a single fact."""
        semantic_model = SemanticModel()
        mock_load_models.return_value = None
        
        test_fact = {
            'fact_uid': 'fact_123',
            'lh_object_uid': '11111',
            'lh_object_name': 'Entity 1',
            'rel_type_uid': '55555',
            'rel_type_name': 'specialization',
            'rh_object_uid': '22222',
            'rh_object_name': 'Entity 2'
        }
        
        await semantic_model.addFact(test_fact)
        
        # Verify fact was added
        assert len(semantic_model._facts) == 1
        assert semantic_model._facts[0] == test_fact
        
        # Verify loadModelsForFacts was called
        mock_load_models.assert_called_once_with(test_fact)
    
    @patch('src.relica_nous_langchain.SemanticModel.SemanticModel.loadModelsForFacts')
    async def test_add_fact_duplicate(self, mock_load_models):
        """Test adding a fact that already exists (should replace)."""
        semantic_model = SemanticModel()
        mock_load_models.return_value = None
        
        # Add initial fact
        initial_fact = {
            'fact_uid': 'fact_123',
            'lh_object_uid': '11111',
            'lh_object_name': 'Entity 1',
            'rel_type_uid': '55555',
            'rel_type_name': 'specialization',
            'rh_object_uid': '22222',
            'rh_object_name': 'Entity 2'
        }
        
        await semantic_model.addFact(initial_fact)
        
        # Add updated fact with same UID
        updated_fact = {
            'fact_uid': 'fact_123',
            'lh_object_uid': '11111',
            'lh_object_name': 'Entity 1 Updated',
            'rel_type_uid': '55555',
            'rel_type_name': 'specialization',
            'rh_object_uid': '22222',
            'rh_object_name': 'Entity 2 Updated'
        }
        
        await semantic_model.addFact(updated_fact)
        
        # Verify fact was replaced
        assert len(semantic_model._facts) == 1
        assert semantic_model._facts[0] == updated_fact
        assert semantic_model._facts[0]['lh_object_name'] == 'Entity 1 Updated'
    
    @patch('src.relica_nous_langchain.SemanticModel.SemanticModel.loadModelsForFacts')
    async def test_add_facts_multiple(self, mock_load_models):
        """Test adding multiple facts."""
        semantic_model = SemanticModel()
        mock_load_models.return_value = None
        
        test_facts = [
            {
                'fact_uid': 'fact_1',
                'lh_object_uid': '11111',
                'rel_type_uid': '55555',
                'rh_object_uid': '22222'
            },
            {
                'fact_uid': 'fact_2',
                'lh_object_uid': '22222',
                'rel_type_uid': '66666',
                'rh_object_uid': '33333'
            },
            {
                'fact_uid': 'fact_3',
                'lh_object_uid': '33333',
                'rel_type_uid': '77777',
                'rh_object_uid': '44444'
            }
        ]
        
        await semantic_model.addFacts(test_facts)
        
        # Verify all facts were added
        assert len(semantic_model._facts) == 3
        for fact in test_facts:
            assert fact in semantic_model._facts
        
        # Verify loadModelsForFacts was called with all facts
        mock_load_models.assert_called_once_with(test_facts)
    
    @patch('src.relica_nous_langchain.SemanticModel.SemanticModel.removeOrphanedModelsForRemovedFacts')
    async def test_remove_fact(self, mock_remove_orphaned):
        """Test removing a single fact."""
        semantic_model = SemanticModel()
        mock_remove_orphaned.return_value = []
        
        # Add test facts first
        test_facts = [
            {'fact_uid': 'fact_1', 'lh_object_uid': '11111', 'rh_object_uid': '22222'},
            {'fact_uid': 'fact_2', 'lh_object_uid': '22222', 'rh_object_uid': '33333'}
        ]
        semantic_model._facts = test_facts.copy()
        
        await semantic_model.removeFact('fact_1')
        
        # Verify removeOrphanedModelsForRemovedFacts was called
        mock_remove_orphaned.assert_called_once_with('fact_1')
    
    @patch('src.relica_nous_langchain.SemanticModel.SemanticModel.removeOrphanedModelsForRemovedFacts')
    async def test_remove_facts_multiple(self, mock_remove_orphaned):
        """Test removing multiple facts."""
        semantic_model = SemanticModel()
        mock_remove_orphaned.return_value = []
        
        # Add test facts first
        test_facts = [
            {'fact_uid': 'fact_1', 'lh_object_uid': '11111', 'rh_object_uid': '22222'},
            {'fact_uid': 'fact_2', 'lh_object_uid': '22222', 'rh_object_uid': '33333'},
            {'fact_uid': 'fact_3', 'lh_object_uid': '33333', 'rh_object_uid': '44444'}
        ]
        semantic_model._facts = test_facts.copy()
        
        fact_uids_to_remove = ['fact_1', 'fact_3']
        await semantic_model.removeFacts(fact_uids_to_remove)
        
        # Verify removeOrphanedModelsForRemovedFacts was called
        mock_remove_orphaned.assert_called_once_with(fact_uids_to_remove)
    
    def test_has_fact_involving_uid(self):
        """Test checking if a UID is involved in any facts."""
        semantic_model = SemanticModel()
        
        # Add test facts
        test_facts = [
            {'fact_uid': 'fact_1', 'lh_object_uid': '11111', 'rh_object_uid': '22222'},
            {'fact_uid': 'fact_2', 'lh_object_uid': '33333', 'rh_object_uid': '44444'}
        ]
        semantic_model._facts = test_facts
        
        # Test UIDs that are involved
        assert semantic_model.hasFactInvolvingUID('11111') is True
        assert semantic_model.hasFactInvolvingUID('22222') is True
        assert semantic_model.hasFactInvolvingUID('33333') is True
        assert semantic_model.hasFactInvolvingUID('44444') is True
        
        # Test UID that is not involved
        assert semantic_model.hasFactInvolvingUID('99999') is False


@pytest.mark.unit
@pytest.mark.asyncio
class TestSemanticModelModelLoading:
    """Test SemanticModel model loading functionality."""
    
    @patch('src.relica_nous_langchain.services.clarity_client.clarity_client.retrieveModels')
    async def test_load_models_for_facts_success(self, mock_retrieve_models):
        """Test successful model loading for facts."""
        semantic_model = SemanticModel()
        
        # Mock successful API response
        mock_response = {
            'payload': {
                'models': [
                    {'uid': '11111', 'name': 'Entity 1', 'type': 'kind'},
                    {'uid': '22222', 'name': 'Entity 2', 'type': 'individual'}
                ]
            }
        }
        mock_retrieve_models.return_value = mock_response
        
        test_facts = [
            {'lh_object_uid': '11111', 'rh_object_uid': '22222'},
            {'lh_object_uid': '22222', 'rh_object_uid': '33333'}
        ]
        
        result = await semantic_model.loadModelsForFacts(test_facts)
        
        # Verify models were loaded
        assert '11111' in semantic_model._models
        assert '22222' in semantic_model._models
        assert len(semantic_model._models) == 2
        
        # Verify API was called with correct UIDs
        expected_uids = ['11111', '22222', '33333']
        mock_retrieve_models.assert_called_once()
        called_uids = mock_retrieve_models.call_args[0][0]
        assert set(called_uids) == set(expected_uids)
        
        # Verify return value
        assert result == mock_response['payload']['models']
    
    @patch('src.relica_nous_langchain.services.clarity_client.clarity_client.retrieveModels')
    async def test_load_models_for_facts_single_fact(self, mock_retrieve_models):
        """Test model loading for a single fact."""
        semantic_model = SemanticModel()
        
        mock_response = {
            'payload': {
                'models': [
                    {'uid': '11111', 'name': 'Entity 1', 'type': 'kind'}
                ]
            }
        }
        mock_retrieve_models.return_value = mock_response
        
        # Pass single fact (not in list)
        test_fact = {'lh_object_uid': '11111', 'rh_object_uid': '22222'}
        
        result = await semantic_model.loadModelsForFacts(test_fact)
        
        # Verify models were loaded
        assert '11111' in semantic_model._models
        assert result is not None
    
    @patch('src.relica_nous_langchain.services.clarity_client.clarity_client.retrieveModels')
    async def test_load_models_existing_models_skipped(self, mock_retrieve_models):
        """Test that existing models are not reloaded."""
        semantic_model = SemanticModel()
        
        # Add existing model
        existing_model = {'uid': '11111', 'name': 'Existing Entity'}
        semantic_model.addModel(existing_model)
        
        mock_response = {
            'payload': {
                'models': [
                    {'uid': '22222', 'name': 'New Entity'}
                ]
            }
        }
        mock_retrieve_models.return_value = mock_response
        
        test_facts = [
            {'lh_object_uid': '11111', 'rh_object_uid': '22222'}
        ]
        
        await semantic_model.loadModelsForFacts(test_facts)
        
        # Verify only new model was requested
        mock_retrieve_models.assert_called_once_with(['22222'])
        assert len(semantic_model._models) == 2
    
    @patch('src.relica_nous_langchain.services.clarity_client.clarity_client.retrieveModels')
    async def test_load_models_empty_facts(self, mock_retrieve_models):
        """Test model loading with empty facts list."""
        semantic_model = SemanticModel()
        
        await semantic_model.loadModelsForFacts([])
        
        # Verify API was not called
        mock_retrieve_models.assert_not_called()
        assert len(semantic_model._models) == 0
    
    @patch('src.relica_nous_langchain.services.clarity_client.clarity_client.retrieveModels')
    async def test_load_models_api_error(self, mock_retrieve_models):
        """Test model loading when API returns error."""
        semantic_model = SemanticModel()
        
        # Mock API error
        mock_retrieve_models.side_effect = Exception("API Error")
        
        test_facts = [
            {'lh_object_uid': '11111', 'rh_object_uid': '22222'}
        ]
        
        result = await semantic_model.loadModelsForFacts(test_facts)
        
        # Verify error is handled gracefully
        assert result is None
        assert len(semantic_model._models) == 0
    
    @patch('src.relica_nous_langchain.services.clarity_client.clarity_client.retrieveModels')
    async def test_load_models_malformed_response(self, mock_retrieve_models):
        """Test model loading with malformed API response."""
        semantic_model = SemanticModel()
        
        # Mock malformed response
        mock_retrieve_models.return_value = {'invalid': 'response'}
        
        test_facts = [
            {'lh_object_uid': '11111', 'rh_object_uid': '22222'}
        ]
        
        result = await semantic_model.loadModelsForFacts(test_facts)
        
        # Verify error is handled gracefully
        assert result is None
        assert len(semantic_model._models) == 0


@pytest.mark.unit
@pytest.mark.asyncio
class TestSemanticModelOrphanedModelCleanup:
    """Test SemanticModel orphaned model cleanup functionality."""
    
    async def test_remove_orphaned_models_basic(self):
        """Test basic orphaned model removal."""
        semantic_model = SemanticModel()
        
        # Add models and facts
        models = [
            {'uid': '11111', 'name': 'Entity 1'},
            {'uid': '22222', 'name': 'Entity 2'},
            {'uid': '33333', 'name': 'Entity 3'},
            {'uid': '44444', 'name': 'Entity 4'}
        ]
        semantic_model.addModels(models)
        
        facts = [
            {'fact_uid': 'fact_1', 'lh_object_uid': '11111', 'rh_object_uid': '22222'},
            {'fact_uid': 'fact_2', 'lh_object_uid': '22222', 'rh_object_uid': '33333'},
            {'fact_uid': 'fact_3', 'lh_object_uid': '44444', 'rh_object_uid': '11111'}  # Will be removed
        ]
        semantic_model._facts = facts
        
        # Remove fact_3, which should make entity 44444 orphaned
        removed_fact_uids = ['fact_3']
        
        orphaned = await semantic_model.removeOrphanedModelsForRemovedFacts(removed_fact_uids)
        
        # Verify orphaned model was identified and removed
        assert '44444' in orphaned
        assert '44444' not in semantic_model._models
        
        # Verify non-orphaned models remain
        assert '11111' in semantic_model._models
        assert '22222' in semantic_model._models
        assert '33333' in semantic_model._models
    
    async def test_remove_orphaned_models_no_orphans(self):
        """Test orphaned model removal when no models are orphaned."""
        semantic_model = SemanticModel()
        
        # Add models and facts where all models are still referenced
        models = [
            {'uid': '11111', 'name': 'Entity 1'},
            {'uid': '22222', 'name': 'Entity 2'},
            {'uid': '33333', 'name': 'Entity 3'}
        ]
        semantic_model.addModels(models)
        
        facts = [
            {'fact_uid': 'fact_1', 'lh_object_uid': '11111', 'rh_object_uid': '22222'},
            {'fact_uid': 'fact_2', 'lh_object_uid': '22222', 'rh_object_uid': '33333'},
            {'fact_uid': 'fact_3', 'lh_object_uid': '33333', 'rh_object_uid': '11111'}  # Will be removed but entities still referenced
        ]
        semantic_model._facts = facts
        
        # Remove fact_3
        orphaned = await semantic_model.removeOrphanedModelsForRemovedFacts(['fact_3'])
        
        # Verify no models were orphaned
        assert len(orphaned) == 0
        assert len(semantic_model._models) == 3
    
    async def test_remove_orphaned_models_single_fact_uid(self):
        """Test orphaned model removal with single fact UID (not in list)."""
        semantic_model = SemanticModel()
        
        # Add models and facts
        models = [
            {'uid': '11111', 'name': 'Entity 1'},
            {'uid': '22222', 'name': 'Entity 2'}
        ]
        semantic_model.addModels(models)
        
        facts = [
            {'fact_uid': 'fact_1', 'lh_object_uid': '11111', 'rh_object_uid': '22222'}
        ]
        semantic_model._facts = facts
        
        # Remove single fact UID (not in list)
        orphaned = await semantic_model.removeOrphanedModelsForRemovedFacts('fact_1')
        
        # Verify both models are orphaned since the fact is removed
        assert '11111' in orphaned
        assert '22222' in orphaned
        assert len(semantic_model._models) == 0
    
    async def test_remove_orphaned_models_empty_list(self):
        """Test orphaned model removal with empty removal list."""
        semantic_model = SemanticModel()
        
        # Add some models
        models = [
            {'uid': '11111', 'name': 'Entity 1'},
            {'uid': '22222', 'name': 'Entity 2'}
        ]
        semantic_model.addModels(models)
        
        # Remove empty list
        orphaned = await semantic_model.removeOrphanedModelsForRemovedFacts([])
        
        # Verify nothing was removed
        assert len(orphaned) == 0
        assert len(semantic_model._models) == 2


@pytest.mark.unit
class TestSemanticModelFormatting:
    """Test SemanticModel formatting and representation functionality."""
    
    def test_format_relationships_basic(self):
        """Test basic relationship formatting."""
        semantic_model = SemanticModel()
        
        test_facts = [
            {
                'lh_object_uid': '11111',
                'lh_object_name': 'Car',
                'rel_type_name': 'specialization',
                'rh_object_uid': '22222',
                'rh_object_name': 'Vehicle'
            },
            {
                'lh_object_uid': '33333',
                'lh_object_name': 'Toyota Camry',
                'rel_type_name': 'classification',
                'rh_object_uid': '11111',
                'rh_object_name': 'Car'
            }
        ]
        semantic_model._facts = test_facts
        
        result = semantic_model.format_relationships()
        
        # Verify relationships are formatted correctly
        assert '- Car(11111) -> specialization -> Vehicle(22222)' in result
        assert '- Toyota Camry(33333) -> classification -> Car(11111)' in result
    
    def test_format_relationships_empty(self):
        """Test relationship formatting with no facts."""
        semantic_model = SemanticModel()
        
        result = semantic_model.format_relationships()
        
        # Should return empty string or just newlines
        assert result == ""
    
    def test_format_relationships_missing_names(self):
        """Test relationship formatting with missing entity names."""
        semantic_model = SemanticModel()
        
        test_facts = [
            {
                'lh_object_uid': '11111',
                # Missing lh_object_name
                'rel_type_name': 'specialization',
                'rh_object_uid': '22222',
                'rh_object_name': 'Vehicle'
            }
        ]
        semantic_model._facts = test_facts
        
        result = semantic_model.format_relationships()
        
        # Should handle missing names gracefully
        assert 'Entity 11111' in result  # Default name for missing lh_object_name
        assert 'Vehicle(22222)' in result
    
    def test_get_model_representation_existing(self):
        """Test getting model representation for existing entity."""
        semantic_model = SemanticModel()
        
        test_model = {
            'uid': '12345',
            'name': 'Test Entity',
            'nature': 'kind',
            'category': 'concept',
            'definition': [
                {
                    'supertype_name': 'Parent Type',
                    'full_definition': 'A test entity for demonstration'
                }
            ]
        }
        semantic_model.addModel(test_model)
        
        result = semantic_model.getModelRepresentation('12345')
        
        # Verify representation contains key information
        assert '[ENTITY: 12345]' in result
        assert 'Test Entity' in result
        assert 'kind' in result
        assert 'concept' in result
        assert 'DEFINITIONS:' in result
        assert 'A test entity for demonstration' in result
    
    def test_get_model_representation_nonexistent(self):
        """Test getting model representation for non-existent entity."""
        semantic_model = SemanticModel()
        
        result = semantic_model.getModelRepresentation('nonexistent')
        
        # Should return default message
        assert result == "No specific entity selected\n"
    
    def test_format_entity_kind(self):
        """Test formatting a kind entity."""
        semantic_model = SemanticModel()
        
        kind_model = {
            'uid': '12345',
            'name': 'Vehicle',
            'nature': 'kind',
            'category': 'physical object',
            'definition': [
                {
                    'supertype_name': 'Physical Object',
                    'full_definition': 'A means of carrying or transporting something'
                }
            ],
            'requiring_kinds_of_relations': ['ownership', 'usage'],
            'possible_kinds_of_role_players': ['person', 'organization']
        }
        
        result = semantic_model.format_entity(kind_model)
        
        # Verify kind-specific formatting
        assert '[ENTITY: 12345]' in result
        assert 'NAME: Vehicle' in result
        assert 'TYPE: kind physical object' in result
        assert 'DEFINITIONS:' in result
        assert 'A means of carrying or transporting something' in result
        assert 'USED IN RELATIONS:' in result
        assert 'CAN BE PLAYED BY:' in result
    
    def test_format_entity_individual(self):
        """Test formatting an individual entity."""
        semantic_model = SemanticModel()
        
        individual_model = {
            'uid': '67890',
            'name': 'My Car',
            'nature': 'individual',
            'category': 'physical object',
            'classifiers': ['car', 'vehicle'],
            'aspects': [
                {'name': 'color', 'value': 'blue'},
                {'name': 'year', 'value': '2020'}
            ]
        }
        
        result = semantic_model.format_entity(individual_model)
        
        # Verify individual-specific formatting
        assert '[ENTITY: 67890]' in result
        assert 'NAME: My Car' in result
        assert 'TYPE: individual physical object' in result
        assert 'CLASSIFIED AS:' in result
        assert 'car, vehicle' in result
        assert 'ASPECTS:' in result
        assert 'color: blue' in result
        assert 'year: 2020' in result
    
    def test_generate_ontology_metadata(self):
        """Test generating ontology metadata."""
        semantic_model = SemanticModel()
        
        # Add test models
        models = [
            {'uid': '1', 'type': 'kind', 'category': 'concept'},
            {'uid': '2', 'type': 'kind', 'category': 'relation'},
            {'uid': '3', 'type': 'individual', 'category': 'object'},
            {'uid': '4', 'type': 'individual', 'category': 'object'}
        ]
        semantic_model.addModels(models)
        
        # Add test facts
        semantic_model._facts = [
            {'fact_uid': 'f1'}, {'fact_uid': 'f2'}, {'fact_uid': 'f3'}
        ]
        
        # Set selected entity
        semantic_model.selected_entity = '12345'
        
        result = semantic_model.generate_ontology_metadata()
        
        # Verify metadata content
        assert 'TOTAL ENTITIES: 4' in result
        assert 'KINDS: 2' in result
        assert 'INDIVIDUALS: 2' in result
        assert 'ENTITY TYPES: concept, relation, object' in result
        assert 'FACTS COUNT: 3' in result
        assert 'SELECTED ENTITY: 12345' in result
    
    def test_context_property(self):
        """Test comprehensive context generation."""
        semantic_model = SemanticModel()
        
        # Add test data
        test_model = {
            'uid': '12345',
            'name': 'Test Entity',
            'nature': 'kind',
            'category': 'concept'
        }
        semantic_model.addModel(test_model)
        
        test_fact = {
            'lh_object_uid': '12345',
            'lh_object_name': 'Test Entity',
            'rel_type_name': 'specialization',
            'rh_object_uid': '67890',
            'rh_object_name': 'Parent Entity'
        }
        semantic_model._facts = [test_fact]
        
        result = semantic_model.context
        
        # Verify context structure
        assert '[ONTOLOGY_METADATA]' in result
        assert '[ENTITIES]' in result
        assert '[RELATIONSHIPS]' in result
        assert 'Test Entity' in result
        assert 'specialization' in result
    
    def test_facts_to_categorized_facts_str(self):
        """Test categorized facts string formatting."""
        semantic_model = SemanticModel()
        
        test_facts = [
            {
                'rel_type_uid': '1001',
                'lh_object_name': 'Car',
                'rel_type_name': 'specialization',
                'rh_object_name': 'Vehicle'
            },
            {
                'rel_type_uid': '1001',
                'lh_object_name': 'Truck',
                'rel_type_name': 'specialization',
                'rh_object_name': 'Vehicle'
            },
            {
                'rel_type_uid': '2001',
                'lh_object_name': 'John',
                'rel_type_name': 'ownership',
                'rh_object_name': 'My Car'
            }
        ]
        
        result = semantic_model.facts_to_categorized_facts_str(test_facts)
        
        # Verify categorization
        assert '# 1001:' in result
        assert '# 2001:' in result
        assert 'Car -> specialization -> Vehicle' in result
        assert 'Truck -> specialization -> Vehicle' in result
        assert 'John -> ownership -> My Car' in result 