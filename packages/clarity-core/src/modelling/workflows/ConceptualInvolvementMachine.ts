// RELATION MACHINE
//
const machine: any = {
  context: {},
  id: 'Rel',
  initial: 'BD',
  states: {
    BD: {
      on: {
        NEXT: {
          target: 'END',
        },
      },
    },
    END: {
      type: 'final',
    },
  },
};

export default machine;
