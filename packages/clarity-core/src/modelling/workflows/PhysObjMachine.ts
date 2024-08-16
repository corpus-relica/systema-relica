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
          fieldMap: 'Function:New Concept',
          workflowId: 'DNKO',
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
        params: {
          fieldMap: 'Part Object:New Concept',
          workflowId: 'DNKPO',
        },
      },
      description: 'create part phys obj',
    },
    END: {
      type: 'final',
    },
  },
};

export default machine;
