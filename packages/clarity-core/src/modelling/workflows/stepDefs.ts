export type SourceType =
  | 'free'
  | 'context'
  | 'knowledge-graph'
  | 'workflow'
  | 'context | workflow'
  | 'knowledge-graph | workflow';

interface FieldSource {
  field: string;
  source: SourceType;
  workflowId?: string;
  query?: string;
}

interface Step {
  id: string;
  description: string;
  pattern: string[]; // GNS strings
  isRepeatable?: boolean;
  fieldSources: FieldSource[];
}

const step1: Step = {
  id: 'define-supertype-physical-object-name-and-definition',
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

const step3: Step = {
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

const step4: Step = {
  id: 'define-desciminating-aspects',
  description:
    'Define the discriminating aspects of the new concept that distinguish it from other concepts',
  pattern: ['?.New Concept > 5283.is by definition > ?.qaulitative subtype'],
  fieldSources: [
    {
      field: 'New Concept',
      source: 'context',
    },
    {
      field: 'qualitative subtype',
      source: 'knowledge-graph | workflow',
      query: '* > 1726 > 730044',
      workflowId: 'define-qualitative-subtype',
    },
  ],
};

const someOtherWorkflowStep1: Step = {
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

export const stepDefs = {
  step1: step1,
  step3: step3,
  step4: step4,
  someOtherWorkflowStep1: someOtherWorkflowStep1,
};
