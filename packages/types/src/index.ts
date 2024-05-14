export interface Fact {
    sequence?: number;
    language_uid?: number;
    language?: string;
    lh_context_uid?: number;
    lh_context_name?: string;
    lh_object_uid: number;
    lh_cardinalities?: string;
    lh_object_name?: string;
    fact_uid: number;
    rel_type_uid: number;
    rel_type_name?: string;
    rh_object_uid: number;
    rh_cardinalities?: string;
    rh_object_name?: string;
    partial_definition?: string;
    full_definition?: string;
    uom_uid?: number;
    uom_name?: string;
    remarks?: string;
    approval_status?: string;
    successor_uid?: number;
    effective_from?: string;
    latest_update?: string;
    author?: string;
    reference?: string;
    collection_uid?: number;
    collection_name?: string;
    validity_context_uid?: number;
    validity_context_name?: string;
}

export const emptyFact: Fact = {
    sequence: undefined,
    language_uid: 910036,
    language: "English",
    lh_context_uid: undefined,
    lh_context_name: "",
    lh_object_uid: 0,
    lh_cardinalities: "",
    lh_object_name: "",
    fact_uid: -1,
    rel_type_uid: 0,
    rel_type_name: "",
    rh_object_uid: 0,
    rh_cardinalities: "",
    rh_object_name: "",
    partial_definition: "",
    full_definition: "",
    uom_uid: undefined,
    uom_name: "",
    remarks: "",
    approval_status: "proposed",
    successor_uid: undefined,
    effective_from: "",
    latest_update: "",
    author: "Marc Christophe",
    reference: "Corpus Relica",
    collection_uid: undefined,
    collection_name: "",
    validity_context_uid: undefined,
    validity_context_name: "",
};

//101 ,3, 201
export interface SubsetMin {
    lh_object_name: string;
    rel_type_name: string;
    rh_object_name: string;
}

//1, 101, 3, 201, 7
export interface SubsetMinExt extends SubsetMin {
    fact_uid: number;
    uom_name: string;
}

//2, 101, 1, 60, 3, 15, 201, 8, 9 and 10
export interface SubsetFlex {
    lh_object_uid: number;
    lh_object_name: string;
    fact_uid: number;
    rel_type_uid: number;
    rel_type_name: string;
    rh_object_uid: number;
    rh_object_name: string;
    approval_status: string;
    effective_from: string;
    latest_update: string;
}

//0, 69, 54, 71, 16, 2, 101, 1, 8, 67, 9, 10, 12 and 13
export interface SubsetNom {
    sequence: string;
    language_uid: number;
    language: string;
    lh_context_uid: number;
    lh_context_name: string;
    lh_object_uid: number;
    lh_object_name: string;
    fact_uid: number;
    approval_status: string;
    //succeeding_idea_uid: number;
    effective_from: string;
    latest_update: string;
    author: string;
    reference: string;
}

//0, 69, 54, 71, 16, 2, 101, 1, 4, 14, 8, 67, 9, 10, 12 and 13.
export interface SubsetDict extends SubsetNom {
    full_definition: string;
    remarks: string;
}

//0, 69, 54, 71, 16, 2, 101, 1, 15, 201, 14, 8, 67, 9, 10, 12 and 13.
export interface SubsetTax extends SubsetDict {
    rh_object_uid: number;
    rh_object_name: string;
}

export const subsetTaxKeys = [
    "sequence",
    "language_uid",
    "language",
    "lh_context_uid",
    "lh_context_name",
    "lh_object_uid",
    "lh_object_name",
    "rh_object_uid",
    "rh_object_name",
    "fact_uid",
    "approval_status",
    "effective_from",
    "latest_update",
    "author",
    "reference",
    "full_definition",
    "remarks",
];

//0, 69, 54, 71, 16, 2, 44, 101, 1, 60, 3, 15, 45, 201, 65, 4, 30, 31, 66, 7, 14, 8, 67, 9, 10, 12, 13, 50 and 68.
export interface SubsetProduct extends SubsetTax {
    sequence: string;
    language_uid: number;
    language: string;
    lh_context_uid: number;
    lh_context_name: string;
    lh_object_card: string;
    lh_object_uid: number;
    lh_object_name: string;
    fact_uid: number;
    rel_type_uid: number;
    rel_type_name: string;
    rh_object_card: string;
    rh_object_uid: number;
    rh_object_name: string;
    partial_definiton: string;
    full_definition: string;
    ext_uid: number;
    ext_name: string;
    uom_uid: number;
    uom_name: string;
    remarks: string;
    approval_status: string;
    // succeeding_idea_uid: number;
    effective_from: string;
    latest_update: string;
    author: string;
    reference: string;
    collection_uid: string;
    collection_name: string;
}

// 0, 69, 54, 71, 16, 39, 5, 43, 44, 2, 101, 72, 73, 19, 18, 1, 42, 60, 3, 85, 74, 75, 45, 15, 201, 34, 35, 65,
// 4, 30, 31, 32, 33, 66, 7, 76, 77, 70, 20, 14, 8, 24, 67, 9, 23, 22, 10, 11, 83, 6, 12, 78, 79, 13, 53, 50, 68.
export interface SubsetBusiness extends SubsetProduct {
    reality: string;
    intent_uid: number;
    intent_name: string;
    lh_role_uid: number;
    lh_role_name: string;
    applicability_ctx_uid: number;
    applicability_ctx_name: string;
    fact_description: string;
    phrase_type: string;
    rh_role_uid: number;
    rh_role_name: string;
    exponent_uid: number;
    exponent_name: string;
    probability_uid: number;
    probability_name: string;
    qual_acc_uid: number;
    qual_acc_name: string;
    picklist_uid: number;
    picklist_name: string;
    reason: string;
    availability_start: string;
    copy_created: string;
    creator_uid: number;
    creator_name: string;
    author_uid: number;
    addressee_uid: number;
    addressee_name: string;
    expression_uid: number;
}
