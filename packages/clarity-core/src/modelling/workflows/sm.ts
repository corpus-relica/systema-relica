export const machine: any = {
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
        BACK: {
          target: 'SpecDistQualAsp',
        },
        DEF_ConcAsp: {
          target: 'DNConcAsp',
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
        BACK: {
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
        BACK: {
          target: 'SpecIntendFunc',
        },
      },
      entry: {
        type: 'invokeDNKO',
      },
    },
    DefPartPhysObj: {
      on: {
        BACK: {
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
