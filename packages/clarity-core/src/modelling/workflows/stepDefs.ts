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
    '?1.Supertype Concept > 1146.is a specialization of > 730044.Physical Object',
  ],
  create: [
    '@full_definition:?definition',
    '?2.New Concept > 1146.is a specialization of > ?1.Supertype Concept',
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
  match: ['?1.New Concept > 1146.is a specialization of > 730000.Anything'],
  create: [
    '?2.Syn > 1981.is a synonym of > ?1.New Concept',
    '?3.Abbrv > 1982.is an abbreviation of > ?1.New Concept',
    '?4.Code > 1983.is a code for > ?1.New Concept',
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
    '?1.Supertype Concept > 1146.is a specialization of > 730000.anything',
    '?2.Conceptual Aspect > 1146.is a specialization of > 790229.aspect',
    '?1.Supertype Concept > 5652.has subtypes that have as distinguishing aspect a > ?2.Conceptual Aspect',
    '?3.New Concept > 1146.is a specialization of > ?1.Supertype Concept',
    '?4.qualitative aspect > 1726.is a qualitative subtype of > ?2.Conceptual Aspect',
  ],
  create: ['?3.New Concept > 5283.is by definition > ?4.qualitative aspect'],
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
    '?1.Supertype Concept > 1146.is a specialization of > 730000.anything',
    '?2.Conceptual Aspect > 1146.is a specialization of > 790229.aspect',
    '?1.Supertype Concept > 5652.has subtypes that have as distinguishing aspect a > ?2.Conceptual Aspect',
  ],
  create: [
    '?3.qualitative aspect > 1726.is a qualitative subtype of > ?2.Conceptual Aspect',
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
  match: ['?1.Supertype Concept > 1146.is a specialization of > 790229.aspect'],
  create: [
    '?2.Conceptual Aspect > 1146.is a specialization of > ?1.Supertype Concept',
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
    '?1.New Concept > 1146.is a specialization of > ?2.Supertype Concept',
    '?3.Intrinsic Aspect > 1146.is a specialization of > 730044.Physical Object',
    '?3.Intrinsic Aspect > 1146.is a specialization of > ?4.Supertype Concept',
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
    '?1.New Concept > 1146.is a specialization of > ?2.Supertype Concept',
    '?3.Intrinsic Aspect > 1146.is a specialization of > 730044.Physical Object',
    '?3.Intrinsic Aspect > 1146.is a specialization of > ?4.Supertype Concept',
  ],
  create: [
    '?1.New Concept > 1146.is a specialization of > ?2.Supertype Concept',
    '?3.Intrinsic Aspect > 1146.is a specialization of > 730044.Physical Object',
    '?3.Intrinsic Aspect > 1146.is a specialization of > ?4.Supertype Concept',
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
    '?1.New Concept > 1146.is a specialization of > ?2.Supertype Concept',
    '?3.Quantitative Aspect > 1146.is a specialization of > 730044.Physical Object',
    '?3.Quantitative Aspect > 1146.is a specialization of > ?2.Supertype Concept',
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
    '?1.Supertype Concept > 1146.is a specialization of > 730000.anything',
    '?2.New Concept > 1146.is a specialization of > ?1.Supertype Concept',
    '?3.Function > 1146.is a specialization of > 193671.occurrence',
  ],
  create: [
    '?2.New Concept > 5536.has by definition as intended function > ?3.Function',
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
    '?1.Supertype Concept > 1146.is a specialization of > 730044.Physical Object',
    '?2.New Concept > 1146.is a specialization of > ?1.Supertype Concept',
    '?3.Part Object > 1146.is a specialization of > 730044.Physical Object',
  ],
  create: ['?3.Part Object > 1190.is a part of > ?2.New Concept'],
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
  match: [
    '?1.New Concept > 1146.is a specialization of > ?2.Supertype Concept',
  ],
  create: ['?1.New Concept > 1146.is denoted by > ?3.Graphical Object'],
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
  match: [
    '?1.New Concept > 1146.is a specialization of > ?2.Supertype Concept',
  ],
  create: ['?1.New Concept > 1146.is denoted by > ?3.Text Object'],
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
    '?1.Text Object > 1146.is a specialization of > 730044.Physical Object',
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
