export const workflowDefs = {
  'new-physical-object': {
    id: 'new-physical-object',
    steps: [
      'defineSupertypePhysicalObject',
      'defineSynonymsCodesAndAbbreviations',
      'specifyDistignuishingQualitativeAspect',
      'defineQualitativeSubtype',
      'specifyDefiningNatureOfIntrinsicAspect',
      'specifyDefiningValuesOfIntrinsicAspect',
      'specifyIntendedFunction',
      'specifyDecompositionStructureOfPhysicalObject',
      'denotationByGraphicalObject',
      'denotationByTextObject',
      'inclusionOfTextInModel',
    ],
  },
  'new-qualitative-subtype': {
    id: 'new-qualitative-subtype',
    steps: ['defineQualitativeSubtype'],
  },
  workflowB: {
    id: 'workflowB',
    steps: ['inclusionOfTextInModel', 'denotationByTextObject'],
  },
};
