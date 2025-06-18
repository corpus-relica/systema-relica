"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityDeselectedEventSchema = exports.EntitySelectedEventSchema = exports.FactsUnloadedEventSchema = exports.FactsLoadedEventSchema = exports.ApertureResponseSchema = exports.ErrorResponseSchema = exports.SuccessResponseSchema = exports.RelationRolePlayersLoadRequestSchema = exports.RelationRequiredRolesLoadRequestSchema = exports.ConnectionLoadInRequestSchema = exports.ConnectionLoadRequestSchema = exports.CompositionLoadInRequestSchema = exports.CompositionLoadRequestSchema = exports.ClassificationLoadFactRequestSchema = exports.ClassificationLoadRequestSchema = exports.SubtypeUnloadConeRequestSchema = exports.SubtypeLoadConeRequestSchema = exports.SubtypeLoadRequestSchema = exports.EntityUnloadMultipleRequestSchema = exports.EntityLoadMultipleRequestSchema = exports.EntityDeselectRequestSchema = exports.EntitySelectRequestSchema = exports.EntityUnloadRequestSchema = exports.EntityLoadRequestSchema = exports.SpecializationLoadRequestSchema = exports.SpecializationLoadFactRequestSchema = exports.SearchLoadUidRequestSchema = exports.SearchLoadTextRequestSchema = exports.EnvironmentClearRequestSchema = exports.EnvironmentCreateRequestSchema = exports.EnvironmentListRequestSchema = exports.EnvironmentGetRequestSchema = exports.ApertureActions = void 0;
const zod_1 = require("zod");
// Aperture WebSocket Actions - based on Clojure implementation
exports.ApertureActions = {
    // Environment Operations
    ENVIRONMENT_GET: 'aperture.environment/get',
    ENVIRONMENT_LIST: 'aperture.environment/list',
    ENVIRONMENT_CREATE: 'aperture.environment/create',
    ENVIRONMENT_CLEAR: 'aperture.environment/clear',
    // Search Operations
    SEARCH_LOAD_TEXT: 'aperture.search/load-text',
    SEARCH_LOAD_UID: 'aperture.search/load-uid',
    // Specialization Operations
    SPECIALIZATION_LOAD_FACT: 'aperture.specialization/load-fact',
    SPECIALIZATION_LOAD: 'aperture.specialization/load',
    // Entity Operations
    ENTITY_LOAD: 'aperture.entity/load',
    ENTITY_UNLOAD: 'aperture.entity/unload',
    ENTITY_LOAD_MULTIPLE: 'aperture.entity/load-multiple',
    ENTITY_UNLOAD_MULTIPLE: 'aperture.entity/unload-multiple',
    ENTITY_SELECT: 'aperture.entity/select',
    ENTITY_DESELECT: 'aperture.entity/deselect',
    // Subtype Operations
    SUBTYPE_LOAD: 'aperture.subtype/load',
    SUBTYPE_LOAD_CONE: 'aperture.subtype/load-cone',
    SUBTYPE_UNLOAD_CONE: 'aperture.subtype/unload-cone',
    // Classification Operations
    CLASSIFICATION_LOAD: 'aperture.classification/load',
    CLASSIFICATION_LOAD_FACT: 'aperture.classification/load-fact',
    // Composition Operations
    COMPOSITION_LOAD: 'aperture.composition/load',
    COMPOSITION_LOAD_IN: 'aperture.composition/load-in',
    // Connection Operations
    CONNECTION_LOAD: 'aperture.connection/load',
    CONNECTION_LOAD_IN: 'aperture.connection/load-in',
    // Relation Operations
    RELATION_REQUIRED_ROLES_LOAD: 'aperture.relation/required-roles-load',
    RELATION_ROLE_PLAYERS_LOAD: 'aperture.relation/role-players-load',
    // Fact-related Events
    FACTS_LOADED: 'aperture.facts/loaded',
    FACTS_UNLOADED: 'aperture.facts/unloaded',
};
// Base schemas
const BaseUserPayloadSchema = zod_1.z.object({
    'user-id': zod_1.z.number(),
});
const BaseEnvironmentPayloadSchema = BaseUserPayloadSchema.extend({
    'environment-id': zod_1.z.number().optional(),
});
const BaseEntityPayloadSchema = BaseEnvironmentPayloadSchema.extend({
    'entity-uid': zod_1.z.number(),
});
// Environment Operations
exports.EnvironmentGetRequestSchema = BaseEnvironmentPayloadSchema;
exports.EnvironmentListRequestSchema = BaseUserPayloadSchema;
exports.EnvironmentCreateRequestSchema = BaseUserPayloadSchema.extend({
    name: zod_1.z.string(),
});
exports.EnvironmentClearRequestSchema = BaseEnvironmentPayloadSchema;
// Search Operations
exports.SearchLoadTextRequestSchema = BaseUserPayloadSchema.extend({
    term: zod_1.z.string(),
});
exports.SearchLoadUidRequestSchema = BaseUserPayloadSchema.extend({
    uid: zod_1.z.number(),
});
// Specialization Operations
exports.SpecializationLoadFactRequestSchema = BaseEnvironmentPayloadSchema.extend({
    uid: zod_1.z.number(),
});
exports.SpecializationLoadRequestSchema = BaseEnvironmentPayloadSchema.extend({
    uid: zod_1.z.number(),
});
// Entity Operations
exports.EntityLoadRequestSchema = BaseEntityPayloadSchema;
exports.EntityUnloadRequestSchema = BaseEntityPayloadSchema;
exports.EntitySelectRequestSchema = BaseEntityPayloadSchema;
exports.EntityDeselectRequestSchema = BaseEnvironmentPayloadSchema;
exports.EntityLoadMultipleRequestSchema = BaseEnvironmentPayloadSchema.extend({
    'entity-uids': zod_1.z.array(zod_1.z.number()),
});
exports.EntityUnloadMultipleRequestSchema = BaseEnvironmentPayloadSchema.extend({
    'entity-uids': zod_1.z.array(zod_1.z.number()),
});
// Subtype Operations
exports.SubtypeLoadRequestSchema = BaseEntityPayloadSchema;
exports.SubtypeLoadConeRequestSchema = BaseEntityPayloadSchema;
exports.SubtypeUnloadConeRequestSchema = BaseEntityPayloadSchema;
// Classification Operations
exports.ClassificationLoadRequestSchema = BaseEntityPayloadSchema;
exports.ClassificationLoadFactRequestSchema = BaseEntityPayloadSchema;
// Composition Operations
exports.CompositionLoadRequestSchema = BaseEntityPayloadSchema;
exports.CompositionLoadInRequestSchema = BaseEntityPayloadSchema;
// Connection Operations
exports.ConnectionLoadRequestSchema = BaseEntityPayloadSchema;
exports.ConnectionLoadInRequestSchema = BaseEntityPayloadSchema;
// Relation Operations
exports.RelationRequiredRolesLoadRequestSchema = BaseEnvironmentPayloadSchema.extend({
    uid: zod_1.z.number(),
});
exports.RelationRolePlayersLoadRequestSchema = BaseEnvironmentPayloadSchema.extend({
    uid: zod_1.z.number(),
});
// Response schemas
const FactSchema = zod_1.z.object({
    fact_uid: zod_1.z.number(),
    lh_object_uid: zod_1.z.number(),
    lh_object_name: zod_1.z.string(),
    rel_type_uid: zod_1.z.number(),
    rel_type_name: zod_1.z.string(),
    rh_object_uid: zod_1.z.number(),
    rh_object_name: zod_1.z.string(),
    full_definition: zod_1.z.string().optional(),
    uom_uid: zod_1.z.number().optional(),
    uom_name: zod_1.z.string().optional(),
});
const EnvironmentSchema = zod_1.z.object({
    id: zod_1.z.number(),
    user_id: zod_1.z.number(),
    name: zod_1.z.string(),
    facts: zod_1.z.array(FactSchema),
    selected_entity_id: zod_1.z.number().optional(),
});
exports.SuccessResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(true),
    environment: EnvironmentSchema.optional(),
    facts: zod_1.z.array(FactSchema).optional(),
    'fact-uids-removed': zod_1.z.array(zod_1.z.number()).optional(),
    'model-uids-removed': zod_1.z.array(zod_1.z.number()).optional(),
});
exports.ErrorResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: zod_1.z.string(),
});
exports.ApertureResponseSchema = zod_1.z.union([exports.SuccessResponseSchema, exports.ErrorResponseSchema]);
// Event schemas
exports.FactsLoadedEventSchema = zod_1.z.object({
    type: zod_1.z.literal('aperture.facts/loaded'),
    facts: zod_1.z.array(FactSchema),
    'user-id': zod_1.z.number(),
    'environment-id': zod_1.z.number(),
});
exports.FactsUnloadedEventSchema = zod_1.z.object({
    type: zod_1.z.literal('aperture.facts/unloaded'),
    'fact-uids': zod_1.z.array(zod_1.z.number()),
    'model-uids': zod_1.z.array(zod_1.z.number()).optional(),
    'user-id': zod_1.z.number(),
    'environment-id': zod_1.z.number(),
});
exports.EntitySelectedEventSchema = zod_1.z.object({
    type: zod_1.z.literal('aperture.entity/selected'),
    'entity-uid': zod_1.z.number(),
    'user-id': zod_1.z.number(),
    'environment-id': zod_1.z.number(),
});
exports.EntityDeselectedEventSchema = zod_1.z.object({
    type: zod_1.z.literal('aperture.entity/deselected'),
    'user-id': zod_1.z.number(),
    'environment-id': zod_1.z.number(),
});
//# sourceMappingURL=aperture.js.map