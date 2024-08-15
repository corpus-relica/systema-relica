export const SpecComp = {
  description: 'Spec Composition',
  match: [
    '?1.New Concept > 1146.is a specialization of > ?2.Supertype Concept',
    '?3.Part Object > 1146.is a specialization of > 730044.Physical Object',
  ],
  create: ['?3.Part Object > 1190.is a part of > ?1.New Concept'],
  meta: {
    category: 'PhysicalObject',
  },
};
