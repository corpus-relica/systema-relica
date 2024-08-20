export const SRP = {
  id: 'SRP',
  description: 'Specify Role Player',
  match: [
    '1.New Concept > 1146.is a specialization of > 160170.role',
    '2.Role Player > 1146.is a specialization of > 730044.physical object',
  ],
  create: [
    '2.Role Player? > 5343.can by definition have a role as a > 1.New Concept',
  ],
  fieldSources: [
    {
      field: 'Role Player',
      source: 'knowledge-graph',
    },
  ],
};
