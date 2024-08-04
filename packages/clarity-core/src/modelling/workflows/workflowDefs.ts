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
  workflowB: {
    id: 'workflowB',
    steps: ['inclusionOfTextInModel', 'denotationByTextObject'],
  },
};
