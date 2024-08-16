// RELATION MACHINE
//
const machine: any = {
  context: {},
  id: 'O',
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
          target: 'End',
        },
        DEF_CncptNvmnt: {
          target: 'DNCncptNvmnt',
        },
      },
    },
    End: {
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
