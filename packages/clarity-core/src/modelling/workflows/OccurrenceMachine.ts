// RELATION MACHINE
//
const machine: any = {
  context: {},
  id: 'DNKO',
  initial: 'BD',
  states: {
    BD: {
      on: {
        NEXT: {
          target: 'SpecCncpInv',
        },
      },
    },
    SpecCncpInv: {
      on: {
        NEXT: {
          target: 'END',
        },
        DEF_CncptNvmnt: {
          target: 'DNCncptNvmnt',
        },
      },
    },
    END: {
      type: 'final',
    },
    DNCncptNvmnt: {
      entry: {
        type: 'INVOKE',
        params: {
          workflowId: 'new-cncpt-nvmnt',
          fieldId: 'someshit',
        },
      },
    },
  },
};

export default machine;
