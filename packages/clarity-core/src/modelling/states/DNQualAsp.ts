export const DNQualAsp = {
  id: 'DNQualAsp',
  description: 'Define New Qualitative Aspect',
  match: [
    '?1.New Concept > 1146.is a specialization of > ?2.Supertype Concept',
    '?3.Conceptual Aspect > 1146.is a specialization of > 790229.aspect',
    '?2.Supertype Concept > 5652.has subtypes that have as distinguishing aspect a > ?3.Conceptual Aspect',
  ],
  create: [
    '?4.Qualitative Aspect > 1726.is a qualitative subtype of > ?3.Conceptual Aspect',
  ],
};
