export const DNConcAsp = {
  id: 'DNConcAsp',
  description: 'Define new Conceptual Aspect',
  match: [
    '1.Supertype Conceptual Aspect? > 1146.is a specialization of > 790229.aspect',
    '1.Supertype Concept > 1146.is a specialization of > 730044.Physical Object',
  ],
  create: [
    '2.Conceptual Aspect? > 1146.is a specialization of > 1.Supertype Conceptual Aspect?',
    '1.Supertype Concept > 5652.has subtypes that have as distinguishing aspect a > 2.Conceptual Aspect?',
  ],
  fieldSources: [
    {
      field: 'Supertype Conceptual Aspect',
      source: 'knowledge-graph',
    },
    {
      field: 'Conceptual Aspect',
      source: 'context',
    },
  ],
};
