export const SpecSynAbbrvCodes = {
  id: 'SpecSynAbbrvCodes',
  description: 'Specify Synonyms Abbreviations and Codes -- foobar',
  match: ['1.New Concept > 1146.is a specialization of > 2.Supertype Concept'],
  create: [
    '3.Syn? > 1981.is a synonym of > 1.New Concept',
    '4.Abbrv? > 1982.is an abbreviation of > 1.New Concept',
    '5.Code? > 1983.is a code for > 1.New Concept',
  ],
  fieldSources: [
    {
      field: 'Syn',
      source: 'context',
    },
    {
      field: 'Abbrv',
      source: 'context',
    },
    {
      field: 'Code',
      source: 'context',
    },
  ],
};
