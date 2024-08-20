export const BD = {
  id: 'BD',
  description: 'Base Definition -- Relation',
  match: ['1.Supertype Concept? > 1146.is a specialization of > 2850.relation'],
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
