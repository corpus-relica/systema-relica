export type SourceType =
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
  match: string[]; // GNS strings
  create: string[]; // GNS strings
  fieldSources: FieldSource[];
}

const defineSupertypePhysicalObject: Step = {
  id: 'define-supertype-physical-object',
  description:
    'Choose or define a new physical objecct as a supertype of the new concept, and define the new concept',
  match: [
    '?.Supertype Concept > 1146.is a specialization of > [730044.Physical Object]',
  ],
  create: [
    '@full_definition:?definition',
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept+',
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

const defineSynonymsCodesAndAbbreviations: Step = {
  id: 'define-synonyms-codes-and-abbreviations',
  description: 'define synonyms, codes, and abbreviations for the new concept',
  match: ['?.New Concept > 1146.is a specialization of > [730000.Anything]'],
  create: [
    '?.Syn* > 1981.is a synonym of > ?.New Concept',
    '?.Abbrv* > 1982.is an abbreviation of > ?.New Concept',
    '?.Code* > 1983.is a code for > ?.New Concept',
  ],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context', // realistically, this would be 'knowledge-graph', but then 'knowledge-graph' would need to account for pending/established facts as well
    },
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

const specifyDistignuishingQualitativeAspect: Step = {
  id: 'specify-distinguishing-qualitative-aspects',
  description:
    'Specify the distinguishing qualitative aspects of the new concept',
  match: [
    '?.Supertype Concept > 1146.is a specialization of > [730000.anything]',
    '?.Conceptual Aspect > 1146.is a specialization of > [790229.aspect]',
    '?.Supertype Concept > 5652.has subtypes that have as distinguishing aspect a > ?.Conceptual Aspect',
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept',
    '?.qualitative aspect > 1726.is a qualitative subtype of > ?.Conceptual Aspect',
  ],
  create: ['?.New Concept > 5283.is by definition > ?.qualitative aspect'],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'qualitative aspect',
      source: 'knowledge-graph | workflow',
      thatField: 'qualitative aspect',
      workflowId: 'new-qualitative-aspect',
    },
  ],
};

const defineQualitativeAspect: Step = {
  id: 'define-qualitative-aspect',
  description: 'Define the qualitative subtype of the conceptual aspect',
  match: [
    '?.Supertype Concept > 1146.is a specialization of > [730000.anything]',
    '?.Conceptual Aspect > 1146.is a specialization of > [790229.aspect]',
    '?.Supertype Concept > 5652.has subtypes that have as distinguishing aspect a > ?.Conceptual Aspect',
  ],
  create: [
    '?.qualitative aspect > 1726.is a qualitative subtype of > ?.Conceptual Aspect',
  ],
  fieldSources: [
    {
      field: 'qualitative aspect',
      source: 'context',
    },
    {
      field: 'Conceptual Aspect',
      source: 'knowledge-graph | workflow',
      thatField: 'Conceptual Aspect',
      workflowId: 'new-conceptual-aspect',
    },
  ],
};

const defineConceptualAspect: Step = {
  id: 'define-conceptual-aspect',
  description: 'Define the conceptual aspect',
  match: [
    '?.Supertype Concept > 1146.is a specialization of > [790229.aspect]',
  ],
  create: [
    '?.Conceptual Aspect > 1146.is a specialization of > ?.Supertype Concept',
  ],
  fieldSources: [
    {
      field: 'Conceptual Aspect',
      source: 'context',
    },
    {
      field: 'Supertype Concept',
      source: 'knowledge-graph | workflow',
      thatField: 'Conceptual Aspect',
      workflowId: 'new-conceptual-aspect',
    },
  ],
};

// @BULLSHIT
const specifyDefiningNatureOfIntrinsicAspect: Step = {
  id: 'specify-defining-nature-of-intrinsic-aspect',
  description: 'Specify the defining nature of the intrinsic aspect',
  match: [
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept',
    '?.Intrinsic Aspect > 1146.is a specialization of > 730044.Physical Object',
    '?.Intrinsic Aspect > 1146.is a specialization of > ?.Supertype Concept',
  ],
  create: [],
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
  match: [
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept',
    '?.Intrinsic Aspect > 1146.is a specialization of > 730044.Physical Object',
    '?.Intrinsic Aspect > 1146.is a specialization of > ?.Supertype Concept',
  ],
  create: [
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
  match: [
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept',
    '?.Quantitative Aspect > 1146.is a specialization of > 730044.Physical Object',
    '?.Quantitative Aspect > 1146.is a specialization of > ?.Supertype Concept',
  ],
  create: [],
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

const specifyIntendedFunction: Step = {
  id: 'specify-intended-function',
  description: 'Specify the intended function of the new concept',
  match: [
    '?.Supertype Concept > 1146.is a specialization of > [730000.anything]',
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept',
    '?.Function > 1146.is a specialization of > [193671.occurrence]',
  ],
  create: [
    '?.New Concept > 5536.has by definition as intended function > ?.Function',
  ],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'Function',
      source: 'knowledge-graph',
    },
  ],
};

const specifyDefiningComponentsOfPhysicalObject: Step = {
  id: 'specify-defining-components-of-physical-object',
  description:
    'Specify the defining component(s) of the new concept physical object',
  match: [
    '?.Supertype Concept > 1146.is a specialization of > [730044.Physical Object]',
    '?.New Concept > 1146.is a specialization of > ?.Supertype Concept',
    '?.Part Object > 1146.is a specialization of > [730044.Physical Object]',
  ],
  create: ['?.Part Object > 1190.is a part of > ?.New Concept'],
  fieldSources: [
    {
      field: 'Part Object',
      source: 'knowledge-graph | workflow',
      thatField: 'New Concept',
      workflowId: 'new-physical-object',
    },
    {
      field: 'New Concept',
      source: 'context',
    },
  ],
};

//@BULLSHIT
const denotationByGraphicalObject: Step = {
  id: 'denotation-by-graphical-object',
  description: 'Denote the new concept by a graphical object',
  match: ['?.New Concept > 1146.is a specialization of > ?.Supertype Concept'],
  create: ['?.New Concept > 1146.is denoted by > ?.Graphical Object'],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'Graphical Object',
      source: 'context',
    },
  ],
};

//@BULLSHIT
const denotationByTextObject: Step = {
  id: 'denotation-by-text-object',
  description: 'Denote the new concept by a text object',
  match: ['?.New Concept > 1146.is a specialization of > ?.Supertype Concept'],
  create: ['?.New Concept > 1146.is denoted by > ?.Text Object'],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'Text Object',
      source: 'context',
    },
  ],
};

//@BULLSHIT
const inclusionOfTextInModel: Step = {
  id: 'inclusion-of-text-in-model',
  description: 'Inclusion of text in the model',
  match: [
    '?.Text Object > 1146.is a specialization of > 730044.Physical Object',
  ],
  create: [],
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
  defineQualitativeAspect,
  defineConceptualAspect,
  //
  // specifyDefiningNatureOfIntrinsicAspect,
  // specifyDefiningValuesOfIntrinsicAspect,
  // defineQuantitativeAspect,
  //
  specifyIntendedFunction,
  specifyDefiningComponentsOfPhysicalObject,
  // denotationByGraphicalObject,
  // denotationByTextObject,
  // inclusionOfTextInModel,
};
