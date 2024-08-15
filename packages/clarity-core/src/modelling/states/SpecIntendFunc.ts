export const SpecIntendFunc = {
  description:
    'Specify Intended Function\n\n- Select a Function\n- Optionally create one first',
  match: [
    '?1.New Concept > 1146.is a specialization of > ?2.Supertype Concept',
    '?2.Function > 1146.is a specialization of > 193671.occurrence',
  ],
  create: [
    '?3.New Concept > 5536.has by definition as intended function > ?2.Function',
  ],
};
