// INVOLVEMENT MACHINE
//
const machine: any = {
  context: {},
  id: 'DNKI',
  initial: 'BD',
  states: {
    BD: {
      on: {
        NEXT: {
          target: 'SRIT',
        },
      },
    },
    SRIT: {
      on: {
        NEXT: {
          target: 'SRO',
        },
        DEF_R: {
          target: 'DNKR1',
        },
      },
    },
    SRO: {
      on: {
        NEXT: {
          target: 'END',
        },
        DEF_R: {
          target: 'DNKR2',
        },
      },
    },
    DNKR1: {
      on: {
        NEXT: {
          target: 'SRIT',
        },
      },
      entry: {
        type: 'invokeDNKR',
        params: {
          fieldMap: 'Role of Involved Thing:New Concept',
          workflowId: 'DNKR',
        },
      },
    },
    END: {
      type: 'final',
    },
    DNKR2: {
      on: {
        NEXT: {
          target: 'SRO',
        },
      },
      entry: {
        type: 'invokeDNKR',
        params: {
          fieldMap: 'Role of Occurrence:New Concept',
          workflowId: 'DNKR',
        },
      },
    },
  },
};

export default machine;
