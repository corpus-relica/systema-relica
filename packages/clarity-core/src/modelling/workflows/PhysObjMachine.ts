const machine: any = {
  context: {},
  id: 'DNKPO',
  initial: 'BD',
  states: {
    BD: {
      on: {
        NEXT: {
          target: 'SpecSynAbbrvCodes',
        },
      },
      description:
        'Base Definition\n\n- (allocate unique id for the concept)\n- specify preferred name of the concept\n- specify direct supertype of the concept\n- provide a textual definition of the concept\n- specify synonyms, codes, abbreviations and translations for the concept',
      meta: {
        category: 'PhysicalObject',
      },
    },
    SpecSynAbbrvCodes: {
      on: {
        NEXT: {
          target: 'SpecDistQualAsp',
        },
      },
    },
    SpecDistQualAsp: {
      on: {
        DEF_QualAsp: {
          target: 'DNQualAsp',
        },
        NEXT: {
          target: 'SpecIntendFunc',
        },
      },
      description:
        'Specify Distinguising Qualitative Aspect\n- Select an Aspect\n  - Optionally create one first',
      meta: {
        category: 'PhysicalObject',
      },
    },
    DNQualAsp: {
      on: {
        NEXT: {
          target: 'SpecDistQualAsp',
        },
        DEF_ConcAsp: {
          target: 'DNConcAsp',
        },
        ASSOC_ConcAsp: {
          target: 'AssocExConcAsp',
        },
      },
    },
    SpecIntendFunc: {
      on: {
        NEXT: {
          target: 'SpecComp',
        },
        DEF_O: {
          target: 'DNKO',
        },
      },
    },
    DNConcAsp: {
      on: {
        NEXT: {
          target: 'DNQualAsp',
        },
      },
    },
    AssocExConcAsp: {
      on: {
        NEXT: {
          target: 'DNQualAsp',
        },
      },
    },
    SpecComp: {
      on: {
        DEF_PO: {
          target: 'DefPartPhysObj',
        },
        NEXT: {
          target: 'END',
        },
      },
    },
    DNKO: {
      on: {
        NEXT: {
          target: 'SpecIntendFunc',
        },
      },
      entry: {
        type: 'invokeDNKO',
        params: {
          fieldId: 'Part Object',
          workflowId: 'new-physical-object',
        },
      },
    },
    DefPartPhysObj: {
      on: {
        NEXT: {
          target: 'SpecComp',
        },
      },
      entry: {
        type: 'invokeDNKPO',
      },
      description: 'create part phys obj',
    },
    END: {
      type: 'final',
    },
  },
};

export default machine;
