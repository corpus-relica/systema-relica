import { z } from 'zod';
export declare const ApertureActions: {
    readonly ENVIRONMENT_GET: "aperture.environment/get";
    readonly ENVIRONMENT_LIST: "aperture.environment/list";
    readonly ENVIRONMENT_CREATE: "aperture.environment/create";
    readonly ENVIRONMENT_CLEAR: "aperture.environment/clear";
    readonly SEARCH_LOAD_TEXT: "aperture.search/load-text";
    readonly SEARCH_LOAD_UID: "aperture.search/load-uid";
    readonly SPECIALIZATION_LOAD_FACT: "aperture.specialization/load-fact";
    readonly SPECIALIZATION_LOAD: "aperture.specialization/load";
    readonly ENTITY_LOAD: "aperture.entity/load";
    readonly ENTITY_UNLOAD: "aperture.entity/unload";
    readonly ENTITY_LOAD_MULTIPLE: "aperture.entity/load-multiple";
    readonly ENTITY_UNLOAD_MULTIPLE: "aperture.entity/unload-multiple";
    readonly ENTITY_SELECT: "aperture.entity/select";
    readonly ENTITY_DESELECT: "aperture.entity/deselect";
    readonly SUBTYPE_LOAD: "aperture.subtype/load";
    readonly SUBTYPE_LOAD_CONE: "aperture.subtype/load-cone";
    readonly SUBTYPE_UNLOAD_CONE: "aperture.subtype/unload-cone";
    readonly CLASSIFICATION_LOAD: "aperture.classification/load";
    readonly CLASSIFICATION_LOAD_FACT: "aperture.classification/load-fact";
    readonly COMPOSITION_LOAD: "aperture.composition/load";
    readonly COMPOSITION_LOAD_IN: "aperture.composition/load-in";
    readonly CONNECTION_LOAD: "aperture.connection/load";
    readonly CONNECTION_LOAD_IN: "aperture.connection/load-in";
    readonly RELATION_REQUIRED_ROLES_LOAD: "aperture.relation/required-roles-load";
    readonly RELATION_ROLE_PLAYERS_LOAD: "aperture.relation/role-players-load";
    readonly FACTS_LOADED: "aperture.facts/loaded";
    readonly FACTS_UNLOADED: "aperture.facts/unloaded";
};
export declare const EnvironmentGetRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'environment-id'?: number | undefined;
}>;
export declare const EnvironmentListRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
}, {
    'user-id': number;
}>;
export declare const EnvironmentCreateRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    name: string;
}, {
    'user-id': number;
    name: string;
}>;
export declare const EnvironmentClearRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'environment-id'?: number | undefined;
}>;
export declare const SearchLoadTextRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    term: z.ZodString;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    term: string;
}, {
    'user-id': number;
    term: string;
}>;
export declare const SearchLoadUidRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    uid: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    uid: number;
    'user-id': number;
}, {
    uid: number;
    'user-id': number;
}>;
export declare const SpecializationLoadFactRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    uid: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    uid: number;
    'user-id': number;
    'environment-id'?: number | undefined;
}, {
    uid: number;
    'user-id': number;
    'environment-id'?: number | undefined;
}>;
export declare const SpecializationLoadRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    uid: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    uid: number;
    'user-id': number;
    'environment-id'?: number | undefined;
}, {
    uid: number;
    'user-id': number;
    'environment-id'?: number | undefined;
}>;
export declare const EntityLoadRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uid': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}>;
export declare const EntityUnloadRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uid': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}>;
export declare const EntitySelectRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uid': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}>;
export declare const EntityDeselectRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'environment-id'?: number | undefined;
}>;
export declare const EntityLoadMultipleRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uids': z.ZodArray<z.ZodNumber, "many">;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uids': number[];
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uids': number[];
    'environment-id'?: number | undefined;
}>;
export declare const EntityUnloadMultipleRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uids': z.ZodArray<z.ZodNumber, "many">;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uids': number[];
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uids': number[];
    'environment-id'?: number | undefined;
}>;
export declare const SubtypeLoadRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uid': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}>;
export declare const SubtypeLoadConeRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uid': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}>;
export declare const SubtypeUnloadConeRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uid': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}>;
export declare const ClassificationLoadRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uid': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}>;
export declare const ClassificationLoadFactRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uid': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}>;
export declare const CompositionLoadRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uid': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}>;
export declare const CompositionLoadInRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uid': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}>;
export declare const ConnectionLoadRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uid': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}>;
export declare const ConnectionLoadInRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    'entity-uid': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}, {
    'user-id': number;
    'entity-uid': number;
    'environment-id'?: number | undefined;
}>;
export declare const RelationRequiredRolesLoadRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    uid: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    uid: number;
    'user-id': number;
    'environment-id'?: number | undefined;
}, {
    uid: number;
    'user-id': number;
    'environment-id'?: number | undefined;
}>;
export declare const RelationRolePlayersLoadRequestSchema: z.ZodObject<{
    'user-id': z.ZodNumber;
} & {
    'environment-id': z.ZodOptional<z.ZodNumber>;
} & {
    uid: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    uid: number;
    'user-id': number;
    'environment-id'?: number | undefined;
}, {
    uid: number;
    'user-id': number;
    'environment-id'?: number | undefined;
}>;
declare const FactSchema: z.ZodObject<{
    fact_uid: z.ZodNumber;
    lh_object_uid: z.ZodNumber;
    lh_object_name: z.ZodString;
    rel_type_uid: z.ZodNumber;
    rel_type_name: z.ZodString;
    rh_object_uid: z.ZodNumber;
    rh_object_name: z.ZodString;
    full_definition: z.ZodOptional<z.ZodString>;
    uom_uid: z.ZodOptional<z.ZodNumber>;
    uom_name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    lh_object_uid: number;
    rh_object_uid: number;
    rel_type_uid: number;
    fact_uid: number;
    lh_object_name: string;
    rel_type_name: string;
    rh_object_name: string;
    full_definition?: string | undefined;
    uom_uid?: number | undefined;
    uom_name?: string | undefined;
}, {
    lh_object_uid: number;
    rh_object_uid: number;
    rel_type_uid: number;
    fact_uid: number;
    lh_object_name: string;
    rel_type_name: string;
    rh_object_name: string;
    full_definition?: string | undefined;
    uom_uid?: number | undefined;
    uom_name?: string | undefined;
}>;
declare const EnvironmentSchema: z.ZodObject<{
    id: z.ZodNumber;
    user_id: z.ZodNumber;
    name: z.ZodString;
    facts: z.ZodArray<z.ZodObject<{
        fact_uid: z.ZodNumber;
        lh_object_uid: z.ZodNumber;
        lh_object_name: z.ZodString;
        rel_type_uid: z.ZodNumber;
        rel_type_name: z.ZodString;
        rh_object_uid: z.ZodNumber;
        rh_object_name: z.ZodString;
        full_definition: z.ZodOptional<z.ZodString>;
        uom_uid: z.ZodOptional<z.ZodNumber>;
        uom_name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }, {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }>, "many">;
    selected_entity_id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: number;
    facts: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }[];
    name: string;
    user_id: number;
    selected_entity_id?: number | undefined;
}, {
    id: number;
    facts: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }[];
    name: string;
    user_id: number;
    selected_entity_id?: number | undefined;
}>;
export declare const SuccessResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    environment: z.ZodOptional<z.ZodObject<{
        id: z.ZodNumber;
        user_id: z.ZodNumber;
        name: z.ZodString;
        facts: z.ZodArray<z.ZodObject<{
            fact_uid: z.ZodNumber;
            lh_object_uid: z.ZodNumber;
            lh_object_name: z.ZodString;
            rel_type_uid: z.ZodNumber;
            rel_type_name: z.ZodString;
            rh_object_uid: z.ZodNumber;
            rh_object_name: z.ZodString;
            full_definition: z.ZodOptional<z.ZodString>;
            uom_uid: z.ZodOptional<z.ZodNumber>;
            uom_name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
            fact_uid: number;
            lh_object_name: string;
            rel_type_name: string;
            rh_object_name: string;
            full_definition?: string | undefined;
            uom_uid?: number | undefined;
            uom_name?: string | undefined;
        }, {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
            fact_uid: number;
            lh_object_name: string;
            rel_type_name: string;
            rh_object_name: string;
            full_definition?: string | undefined;
            uom_uid?: number | undefined;
            uom_name?: string | undefined;
        }>, "many">;
        selected_entity_id: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        facts: {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
            fact_uid: number;
            lh_object_name: string;
            rel_type_name: string;
            rh_object_name: string;
            full_definition?: string | undefined;
            uom_uid?: number | undefined;
            uom_name?: string | undefined;
        }[];
        name: string;
        user_id: number;
        selected_entity_id?: number | undefined;
    }, {
        id: number;
        facts: {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
            fact_uid: number;
            lh_object_name: string;
            rel_type_name: string;
            rh_object_name: string;
            full_definition?: string | undefined;
            uom_uid?: number | undefined;
            uom_name?: string | undefined;
        }[];
        name: string;
        user_id: number;
        selected_entity_id?: number | undefined;
    }>>;
    facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        fact_uid: z.ZodNumber;
        lh_object_uid: z.ZodNumber;
        lh_object_name: z.ZodString;
        rel_type_uid: z.ZodNumber;
        rel_type_name: z.ZodString;
        rh_object_uid: z.ZodNumber;
        rh_object_name: z.ZodString;
        full_definition: z.ZodOptional<z.ZodString>;
        uom_uid: z.ZodOptional<z.ZodNumber>;
        uom_name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }, {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }>, "many">>;
    'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    success: true;
    facts?: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }[] | undefined;
    environment?: {
        id: number;
        facts: {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
            fact_uid: number;
            lh_object_name: string;
            rel_type_name: string;
            rh_object_name: string;
            full_definition?: string | undefined;
            uom_uid?: number | undefined;
            uom_name?: string | undefined;
        }[];
        name: string;
        user_id: number;
        selected_entity_id?: number | undefined;
    } | undefined;
    'fact-uids-removed'?: number[] | undefined;
    'model-uids-removed'?: number[] | undefined;
}, {
    success: true;
    facts?: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }[] | undefined;
    environment?: {
        id: number;
        facts: {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
            fact_uid: number;
            lh_object_name: string;
            rel_type_name: string;
            rh_object_name: string;
            full_definition?: string | undefined;
            uom_uid?: number | undefined;
            uom_name?: string | undefined;
        }[];
        name: string;
        user_id: number;
        selected_entity_id?: number | undefined;
    } | undefined;
    'fact-uids-removed'?: number[] | undefined;
    'model-uids-removed'?: number[] | undefined;
}>;
export declare const ErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodString;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: string;
}, {
    success: false;
    error: string;
}>;
export declare const ApertureResponseSchema: z.ZodUnion<[z.ZodObject<{
    success: z.ZodLiteral<true>;
    environment: z.ZodOptional<z.ZodObject<{
        id: z.ZodNumber;
        user_id: z.ZodNumber;
        name: z.ZodString;
        facts: z.ZodArray<z.ZodObject<{
            fact_uid: z.ZodNumber;
            lh_object_uid: z.ZodNumber;
            lh_object_name: z.ZodString;
            rel_type_uid: z.ZodNumber;
            rel_type_name: z.ZodString;
            rh_object_uid: z.ZodNumber;
            rh_object_name: z.ZodString;
            full_definition: z.ZodOptional<z.ZodString>;
            uom_uid: z.ZodOptional<z.ZodNumber>;
            uom_name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
            fact_uid: number;
            lh_object_name: string;
            rel_type_name: string;
            rh_object_name: string;
            full_definition?: string | undefined;
            uom_uid?: number | undefined;
            uom_name?: string | undefined;
        }, {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
            fact_uid: number;
            lh_object_name: string;
            rel_type_name: string;
            rh_object_name: string;
            full_definition?: string | undefined;
            uom_uid?: number | undefined;
            uom_name?: string | undefined;
        }>, "many">;
        selected_entity_id: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        facts: {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
            fact_uid: number;
            lh_object_name: string;
            rel_type_name: string;
            rh_object_name: string;
            full_definition?: string | undefined;
            uom_uid?: number | undefined;
            uom_name?: string | undefined;
        }[];
        name: string;
        user_id: number;
        selected_entity_id?: number | undefined;
    }, {
        id: number;
        facts: {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
            fact_uid: number;
            lh_object_name: string;
            rel_type_name: string;
            rh_object_name: string;
            full_definition?: string | undefined;
            uom_uid?: number | undefined;
            uom_name?: string | undefined;
        }[];
        name: string;
        user_id: number;
        selected_entity_id?: number | undefined;
    }>>;
    facts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        fact_uid: z.ZodNumber;
        lh_object_uid: z.ZodNumber;
        lh_object_name: z.ZodString;
        rel_type_uid: z.ZodNumber;
        rel_type_name: z.ZodString;
        rh_object_uid: z.ZodNumber;
        rh_object_name: z.ZodString;
        full_definition: z.ZodOptional<z.ZodString>;
        uom_uid: z.ZodOptional<z.ZodNumber>;
        uom_name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }, {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }>, "many">>;
    'fact-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    'model-uids-removed': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    success: true;
    facts?: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }[] | undefined;
    environment?: {
        id: number;
        facts: {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
            fact_uid: number;
            lh_object_name: string;
            rel_type_name: string;
            rh_object_name: string;
            full_definition?: string | undefined;
            uom_uid?: number | undefined;
            uom_name?: string | undefined;
        }[];
        name: string;
        user_id: number;
        selected_entity_id?: number | undefined;
    } | undefined;
    'fact-uids-removed'?: number[] | undefined;
    'model-uids-removed'?: number[] | undefined;
}, {
    success: true;
    facts?: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }[] | undefined;
    environment?: {
        id: number;
        facts: {
            lh_object_uid: number;
            rh_object_uid: number;
            rel_type_uid: number;
            fact_uid: number;
            lh_object_name: string;
            rel_type_name: string;
            rh_object_name: string;
            full_definition?: string | undefined;
            uom_uid?: number | undefined;
            uom_name?: string | undefined;
        }[];
        name: string;
        user_id: number;
        selected_entity_id?: number | undefined;
    } | undefined;
    'fact-uids-removed'?: number[] | undefined;
    'model-uids-removed'?: number[] | undefined;
}>, z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodString;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: string;
}, {
    success: false;
    error: string;
}>]>;
export declare const FactsLoadedEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"aperture.facts/loaded">;
    facts: z.ZodArray<z.ZodObject<{
        fact_uid: z.ZodNumber;
        lh_object_uid: z.ZodNumber;
        lh_object_name: z.ZodString;
        rel_type_uid: z.ZodNumber;
        rel_type_name: z.ZodString;
        rh_object_uid: z.ZodNumber;
        rh_object_name: z.ZodString;
        full_definition: z.ZodOptional<z.ZodString>;
        uom_uid: z.ZodOptional<z.ZodNumber>;
        uom_name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }, {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }>, "many">;
    'user-id': z.ZodNumber;
    'environment-id': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "aperture.facts/loaded";
    facts: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }[];
    'user-id': number;
    'environment-id': number;
}, {
    type: "aperture.facts/loaded";
    facts: {
        lh_object_uid: number;
        rh_object_uid: number;
        rel_type_uid: number;
        fact_uid: number;
        lh_object_name: string;
        rel_type_name: string;
        rh_object_name: string;
        full_definition?: string | undefined;
        uom_uid?: number | undefined;
        uom_name?: string | undefined;
    }[];
    'user-id': number;
    'environment-id': number;
}>;
export declare const FactsUnloadedEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"aperture.facts/unloaded">;
    'fact-uids': z.ZodArray<z.ZodNumber, "many">;
    'model-uids': z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    'user-id': z.ZodNumber;
    'environment-id': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "aperture.facts/unloaded";
    'user-id': number;
    'environment-id': number;
    'fact-uids': number[];
    'model-uids'?: number[] | undefined;
}, {
    type: "aperture.facts/unloaded";
    'user-id': number;
    'environment-id': number;
    'fact-uids': number[];
    'model-uids'?: number[] | undefined;
}>;
export declare const EntitySelectedEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"aperture.entity/selected">;
    'entity-uid': z.ZodNumber;
    'user-id': z.ZodNumber;
    'environment-id': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "aperture.entity/selected";
    'user-id': number;
    'environment-id': number;
    'entity-uid': number;
}, {
    type: "aperture.entity/selected";
    'user-id': number;
    'environment-id': number;
    'entity-uid': number;
}>;
export declare const EntityDeselectedEventSchema: z.ZodObject<{
    type: z.ZodLiteral<"aperture.entity/deselected">;
    'user-id': z.ZodNumber;
    'environment-id': z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "aperture.entity/deselected";
    'user-id': number;
    'environment-id': number;
}, {
    type: "aperture.entity/deselected";
    'user-id': number;
    'environment-id': number;
}>;
export type EnvironmentGetRequest = z.infer<typeof EnvironmentGetRequestSchema>;
export type EnvironmentListRequest = z.infer<typeof EnvironmentListRequestSchema>;
export type EnvironmentCreateRequest = z.infer<typeof EnvironmentCreateRequestSchema>;
export type EnvironmentClearRequest = z.infer<typeof EnvironmentClearRequestSchema>;
export type SearchLoadTextRequest = z.infer<typeof SearchLoadTextRequestSchema>;
export type SearchLoadUidRequest = z.infer<typeof SearchLoadUidRequestSchema>;
export type SpecializationLoadFactRequest = z.infer<typeof SpecializationLoadFactRequestSchema>;
export type SpecializationLoadRequest = z.infer<typeof SpecializationLoadRequestSchema>;
export type EntityLoadRequest = z.infer<typeof EntityLoadRequestSchema>;
export type EntityUnloadRequest = z.infer<typeof EntityUnloadRequestSchema>;
export type EntitySelectRequest = z.infer<typeof EntitySelectRequestSchema>;
export type EntityDeselectRequest = z.infer<typeof EntityDeselectRequestSchema>;
export type EntityLoadMultipleRequest = z.infer<typeof EntityLoadMultipleRequestSchema>;
export type EntityUnloadMultipleRequest = z.infer<typeof EntityUnloadMultipleRequestSchema>;
export type SubtypeLoadRequest = z.infer<typeof SubtypeLoadRequestSchema>;
export type SubtypeLoadConeRequest = z.infer<typeof SubtypeLoadConeRequestSchema>;
export type SubtypeUnloadConeRequest = z.infer<typeof SubtypeUnloadConeRequestSchema>;
export type ClassificationLoadRequest = z.infer<typeof ClassificationLoadRequestSchema>;
export type ClassificationLoadFactRequest = z.infer<typeof ClassificationLoadFactRequestSchema>;
export type CompositionLoadRequest = z.infer<typeof CompositionLoadRequestSchema>;
export type CompositionLoadInRequest = z.infer<typeof CompositionLoadInRequestSchema>;
export type ConnectionLoadRequest = z.infer<typeof ConnectionLoadRequestSchema>;
export type ConnectionLoadInRequest = z.infer<typeof ConnectionLoadInRequestSchema>;
export type RelationRequiredRolesLoadRequest = z.infer<typeof RelationRequiredRolesLoadRequestSchema>;
export type RelationRolePlayersLoadRequest = z.infer<typeof RelationRolePlayersLoadRequestSchema>;
export type ApertureResponse = z.infer<typeof ApertureResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type FactsLoadedEvent = z.infer<typeof FactsLoadedEventSchema>;
export type FactsUnloadedEvent = z.infer<typeof FactsUnloadedEventSchema>;
export type EntitySelectedEvent = z.infer<typeof EntitySelectedEventSchema>;
export type EntityDeselectedEvent = z.infer<typeof EntityDeselectedEventSchema>;
export type Fact = z.infer<typeof FactSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
export {};
//# sourceMappingURL=aperture.d.ts.map