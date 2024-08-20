export const BD = {
  id: 'BD',
  description: 'Base Definition -- Aspect',
  match: ['1.Supertype Concept? > 1146.is a specialization of > 790229.aspect'],
  create: [
    '@full_definition: definition?',
    '2.New Concept? > 1146.is a specialization of > 1.Supertype Concept?',
  ],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'Supertype Concept',
      source: 'knowledge-graph',
    },
    {
      field: 'definition',
      source: 'context',
    },
  ],
};
