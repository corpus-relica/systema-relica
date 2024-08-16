export const AssocExConcAsp = {
  id: 'AssocExConcAsp',
  description: 'Associate Existing Conceptual Aspect',
  match: [
    '1.Supertype Concept > 1146.is a specialization of > 730044.Physical Object',
    '2.Conceptual Aspect? > 1146.is a specialization of > 790229.aspect',
  ],
  create: [
    '1.Supertype Concept > 5652.has subtypes that have as distinguishing aspect a > 2.Conceptual Aspect?',
  ],
  fieldSources: [
    {
      field: 'Conceptual Aspect',
      source: 'knowledge-graph',
    },
  ],
};
