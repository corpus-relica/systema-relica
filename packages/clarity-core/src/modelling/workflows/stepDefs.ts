export type SourceType =
  | 'free'
  | 'context'
  | 'knowledge-graph'
  | 'workflow'
  | 'context | workflow'
  | 'knowledge-graph | workflow';

interface FieldSource {
  field: string;
  thatField?: string;
  source: SourceType;
  workflowId?: string;
  query?: string;
}

interface Step {
  id: string;
  description: string;
  pattern: string[]; // GNS strings
  fieldSources: FieldSource[];
}

const defineSupertypePhysicalObject: Step = {
  id: 'define-supertype-physical-object',
  description:
    'Choose or define a new physical objecct as a supertype of the new concept, and define the new concept',
  pattern: [
    '@full_definition:?definition',
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept+',
    '?.Supertype Concept > 1146.is a specialization of > 730044.Physical Object',
  ],
  fieldSources: [
    {
      field: 'definition',
      source: 'free',
    },
    {
      field: 'Supertype Concept',
      source: 'knowledge-graph',
      query: '* > 1146 > 730044',
    },
    {
      field: 'New Concept',
      source: 'free',
    },
  ],
};

const defineSynonymsCodesAndAbbreviations: Step = {
  id: 'define-synonyms-codes-and-abbreviations',
  description: 'define synonyms, codes, and abbreviations for the new concept',
  pattern: [
    '?.Syn* > 1981.is a synonym of > ?.New Concept',
    '?.Abbrv* > 1982.is an abbreviation of > ?.New Concept',
    '?.Code* > 1983.is a code for > ?.New Concept',
  ],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'Syn',
      source: 'free',
    },
    {
      field: 'Abbrv',
      source: 'free',
    },
    {
      field: 'Code',
      source: 'free',
    },
  ],
};

const specifyDistignuishingQualitativeAspect: Step = {
  id: 'specify-distinguishing-qualitative-aspects',
  description:
    'Specify the distinguishing qualitative aspects of the new concept',
  pattern: ['?.New Concept > 5283.is by definition > ?.qaulitative subtype'],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'qualitative subtype',
      thatField: 'qualitative subtype',
      source: 'knowledge-graph | workflow',
      query: '* > 1726 > 730044',
      workflowId: 'new-qualitative-subtype',
    },
  ],
};

const defineQualitativeSubtype: Step = {
  id: 'define-qualitative-subtype',
  description: 'Define the qualitative subtype of the new concept',
  pattern: [
    '?.Supertype Concept > 5652.has subtypes that have as discriminating aspect a > ?.Aspect',
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept',
    '?.qualitative subtype > 1726.s a qualitative subtype of > ?.Aspect',
  ],
  fieldSources: [
    {
      field: 'Supertype Concept',
      source: 'context',
    },
    {
      field: 'Aspect',
      source: 'knowledge-graph',
      query: '* > 1146 > xxx.aspect...',
    },
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'qualitative subtype',
      source: 'free', // or is it 'knowledge-graph | workflow'?
    },
  ],
};

// @BULLSHIT
const specifyDefiningNatureOfIntrinsicAspect: Step = {
  id: 'specify-defining-nature-of-intrinsic-aspect',
  description: 'Specify the defining nature of the intrinsic aspect',
  pattern: [
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept',
    '?.Intrinsic Aspect > 1146.is a specialization of > 730044.Physical Object',
    '?.Intrinsic Aspect > 1146.is a specialization of > ?.Supertype Concept',
  ],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'Supertype Concept',
      source: 'context',
    },
    {
      field: 'Intrinsic Aspect',
      source: 'knowledge-graph',
      query: '* > 1146 > 730044',
    },
  ],
};

//@Bullshit
const specifyDefiningValuesOfIntrinsicAspect: Step = {
  id: 'specify-defining-values-of-intrinsic-aspect',
  description: 'Specify the defining values of the intrinsic aspect',
  pattern: [
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept',
    '?.Intrinsic Aspect > 1146.is a specialization of > 730044.Physical Object',
    '?.Intrinsic Aspect > 1146.is a specialization of > ?.Supertype Concept',
  ],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'Supertype Concept',
      source: 'context',
    },
    {
      field: 'Intrinsic Aspect',
      source: 'knowledge-graph',
      query: '* > 1146 > 730044',
    },
  ],
};

//@BULLSHIT
const defineQuantitativeAspect: Step = {
  id: 'define-quantitative-aspect',
  description: 'Define the quantitative aspect of the new concept',
  pattern: [
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept',
    '?.Quantitative Aspect > 1146.is a specialization of > 730044.Physical Object',
    '?.Quantitative Aspect > 1146.is a specialization of > ?.Supertype Concept',
  ],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'Supertype Concept',
      source: 'context',
    },
    {
      field: 'Quantitative Aspect',
      source: 'knowledge-graph',
      query: '* > 1146 > 730044',
    },
  ],
};

//@BULLSHIT
const specifyIntendedFunction: Step = {
  id: 'specify-intended-function',
  description: 'Specify the intended function of the new concept',
  pattern: [
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept',
    '?.Intended Function > 1146.is a specialization of > 730044.Physical Object',
    '?.Intended Function > 1146.is a specialization of > ?.Supertype Concept',
  ],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'Supertype Concept',
      source: 'context',
    },
    {
      field: 'Intended Function',
      source: 'knowledge-graph',
      query: '* > 1146 > 730044',
    },
  ],
};

//@BULLSHIT (but slightly less so)
const specifyDecompositionStructureOfPhysicalObject: Step = {
  id: 'specify-decomposition-structure-of-physical-object',
  description:
    'Specify the decomposition structure of the new concept physical object',
  pattern: [
    '?.Part Object > 1190.is a part of > ?.New Concept',
    '?.New Concept > 1190.is a part of > ?.Whole Object',
  ],
  fieldSources: [
    {
      field: 'Part Object',
      thatField: 'New Concept',
      source: 'knowledge-graph | workflow',
      query: '* > 1146 > 730044',
      workflowId: 'new-physical-object',
    },
    {
      field: 'Whole Object',
      thatField: 'New Concept',
      source: 'knowledge-graph | workflow',
      query: '* > 1146 > 730044',
      workflowId: 'new-physical-object',
    },
  ],
};

//@BULLSHIT
const denotationByGraphicalObject: Step = {
  id: 'denotation-by-graphical-object',
  description: 'Denote the new concept by a graphical object',
  pattern: ['?.New Concept > 1146.is denoted by > ?.Graphical Object'],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'Graphical Object',
      source: 'free',
    },
  ],
};

//@BULLSHIT
const denotationByTextObject: Step = {
  id: 'denotation-by-text-object',
  description: 'Denote the new concept by a text object',
  pattern: ['?.New Concept > 1146.is denoted by > ?.Text Object'],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'Text Object',
      source: 'free',
    },
  ],
};

//@BULLSHIT
const inclusionOfTextInModel: Step = {
  id: 'inclusion-of-text-in-model',
  description: 'Inclusion of text in the model',
  pattern: [
    '?.Text Object > 1146.is a specialization of > 730044.Physical Object',
  ],
  fieldSources: [
    {
      field: 'Text Object',
      source: 'context',
    },
  ],
};

export const stepDefs = {
  defineSupertypePhysicalObject,
  defineSynonymsCodesAndAbbreviations,
  specifyDistignuishingQualitativeAspect,
  defineQualitativeSubtype,
  specifyDefiningNatureOfIntrinsicAspect,
  specifyDefiningValuesOfIntrinsicAspect,
  defineQuantitativeAspect,
  specifyIntendedFunction,
  specifyDecompositionStructureOfPhysicalObject,
  denotationByGraphicalObject,
  denotationByTextObject,
  inclusionOfTextInModel,
};
