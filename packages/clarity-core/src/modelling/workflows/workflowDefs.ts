export const workflowDefs = {
  'new-physical-object': {
    id: 'new-physical-object',
    steps: [
      { id: 'defineSupertypePhysicalObject', required: true },
      { id: 'defineSynonymsCodesAndAbbreviations', required: false },
      { id: 'specifyDistignuishingQualitativeAspect', required: false },
      { id: 'defineQualitativeSubtype', required: false },
      { id: 'specifyDefiningNatureOfIntrinsicAspect', required: false },
      { id: 'specifyDefiningValuesOfIntrinsicAspect', required: false },
      { id: 'specifyIntendedFunction', required: false },
      { id: 'specifyDecompositionStructureOfPhysicalObject', required: false },
      { id: 'denotationByGraphicalObject', required: false },
      { id: 'denotationByTextObject', required: false },
      { id: 'inclusionOfTextInModel', required: false },
    ],
  },
  'new-qualitative-subtype': {
    id: 'new-qualitative-subtype',
    steps: [{ id: 'defineQualitativeSubtype', required: true }],
  },
  workflowB: {
    id: 'workflowB',
    steps: [
      { id: 'inclusionOfTextInModel', required: true },
      { id: 'denotationByTextObject', required: true },
    ],
  },
};
