// ROLE MACHINE
//
const machine: any = {
  context: {},
  id: 'DNKR',
  initial: 'BD',
  states: {
    BD: {
      on: {
        NEXT: {
          target: 'SRP',
        },
      },
    },
    SRP: {
      on: {
        DEF_PO: {
          target: 'DNKPO',
        },
        NEXT: {
          target: 'SRR',
        },
      },
    },
    DNKPO: {
      on: {
        NEXT: {
          target: 'SRP',
        },
      },
      entry: {
        type: 'invokeDNKPO',
        params: {
          fieldMap: 'Role Player:New Concept',
          workflowId: 'DNKPO',
        },
      },
    },
    SRR: {
      on: {
        NEXT: {
          target: 'END',
        },
        DEF_Rel: {
          target: 'DNKRel',
        },
      },
    },
    END: {
      type: 'final',
    },
    DNKRel: {
      on: {
        NEXT: {
          target: 'SRR',
        },
      },
      entry: {
        type: 'invokeDNKRel',
        params: {
          fieldMap: 'Requiring Relation:New Concept',
          workflowId: 'DNKRel',
        },
      },
    },
  },
};

export default machine;
