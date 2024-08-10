export const workflowDefs = {
  'new-physical-object': {
    id: 'new-physical-object',
    steps: [
      { id: 'defineSupertypePhysicalObject', required: true },
      { id: 'defineSynonymsCodesAndAbbreviations', required: false },
      { id: 'specifyDistignuishingQualitativeAspect', required: false },
      { id: 'defineQualitativeAspect', required: false },
      // { id: 'specifyDefiningNatureOfIntrinsicAspect', required: false },
      // { id: 'specifyDefiningValuesOfIntrinsicAspect', required: false },
      { id: 'specifyIntendedFunction', required: false },
      { id: 'specifyDefiningComponentsOfPhysicalObject', required: false },
      // { id: 'denotationByGraphicalObject', required: false },
      // { id: 'denotationByTextObject', required: false },
      // { id: 'inclusionOfTextInModel', required: false },
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
