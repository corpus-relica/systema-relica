export type SourceType = 'context' | 'knowledge-graph' | 'workflow' | 'context | workflow' | 'knowledge-graph | workflow';
interface FieldSource {
    field: string;
    thatField?: string;
    source: SourceType;
    workflowId?: string;
    query?: string;
}
interface Step {
    id: string;
    description: string;
    match: string[];
    create: string[];
    fieldSources: FieldSource[];
}
export declare const stepDefs: {
    defineSupertypePhysicalObject: Step;
    defineSynonymsCodesAndAbbreviations: Step;
    specifyDistignuishingQualitativeAspect: Step;
    defineQualitativeAspect: Step;
    defineConceptualAspect: Step;
    specifyIntendedFunction: Step;
    specifyDefiningComponentsOfPhysicalObject: Step;
};
export {};
