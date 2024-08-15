export const SpecSynAbbrvCodes = {
  id: 'BD',
  description: 'Specify Synonyms Abbreviations and Codes -- foobar',
  match: [
    '?1.New Concept > 1146.is a specialization of > ?2.Supertype Concept',
  ],
  create: [
    '?3.Syn > 1981.is a synonym of > ?1.New Concept',
    '?3.Abbrv > 1982.is an abbreviation of > ?1.New Concept',
    '?3.Code > 1983.is a code for > ?1.New Concept',
  ],
};
