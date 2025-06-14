"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowDefs = void 0;
exports.workflowDefs = {
    'new-physical-object': {
        id: 'new-physical-object',
        steps: [
            { id: 'defineSupertypePhysicalObject', required: true },
            { id: 'defineSynonymsCodesAndAbbreviations', required: false },
            { id: 'specifyDistignuishingQualitativeAspect', required: false },
            { id: 'defineQualitativeAspect', required: false },
            { id: 'specifyIntendedFunction', required: false },
            { id: 'specifyDefiningComponentsOfPhysicalObject', required: false },
        ],
    },
    'new-qualitative-aspect': {
        id: 'new-qualitative-aspect',
        steps: [{ id: 'defineQualitativeAspect', required: true }],
    },
    'new-conceptual-aspect': {
        id: 'new-conceptual-aspect',
        steps: [{ id: 'defineConceptualAspect', required: true }],
    },
};
//# sourceMappingURL=workflowDefs.js.map