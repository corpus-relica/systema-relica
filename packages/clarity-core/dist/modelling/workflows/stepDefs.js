"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stepDefs = void 0;
const defineSupertypePhysicalObject = {
    id: 'define-supertype-physical-object',
    description: 'Choose or define a new physical objecct as a supertype of the new concept, and define the new concept',
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
const defineSynonymsCodesAndAbbreviations = {
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
            source: 'context',
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
const specifyDistignuishingQualitativeAspect = {
    id: 'specify-distinguishing-qualitative-aspects',
    description: 'Specify the distinguishing qualitative aspects of the new concept',
    match: [
        '?1.Supertype Concept > 1146.is a specialization of > 730000.anything',
        '?2.Conceptual Aspect > 1146.is a specialization of > 790229.aspect',
        '?1.Supertype Concept > 5652.has subtypes that have as distinguishing aspect a > ?2.Conceptual Aspect',
        '?3.qualitative aspect > 1726.is a qualitative subtype of > ?2.Conceptual Aspect',
    ],
    create: ['?4.New Concept > 5283.is by definition > ?3.qualitative aspect'],
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
const defineQualitativeAspect = {
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
const defineConceptualAspect = {
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
const specifyDefiningNatureOfIntrinsicAspect = {
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
const specifyDefiningValuesOfIntrinsicAspect = {
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
const defineQuantitativeAspect = {
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
const specifyIntendedFunction = {
    id: 'specify-intended-function',
    description: 'Specify the intended function of the new concept',
    match: [
        '?1.Supertype Concept > 1146.is a specialization of > 730000.anything',
        '?2.Function > 1146.is a specialization of > 193671.occurrence',
    ],
    create: [
        '?3.New Concept > 5536.has by definition as intended function > ?2.Function',
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
const specifyDefiningComponentsOfPhysicalObject = {
    id: 'specify-defining-components-of-physical-object',
    description: 'Specify the defining component(s) of the new concept physical object',
    match: [
        '?1.Supertype Concept > 1146.is a specialization of > 730044.Physical Object',
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
const denotationByGraphicalObject = {
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
const denotationByTextObject = {
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
const inclusionOfTextInModel = {
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
exports.stepDefs = {
    defineSupertypePhysicalObject,
    defineSynonymsCodesAndAbbreviations,
    specifyDistignuishingQualitativeAspect,
    defineQualitativeAspect,
    defineConceptualAspect,
    specifyIntendedFunction,
    specifyDefiningComponentsOfPhysicalObject,
};
//# sourceMappingURL=stepDefs.js.map