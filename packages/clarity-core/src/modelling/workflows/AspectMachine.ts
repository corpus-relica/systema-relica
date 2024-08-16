// ASPECT MACHINE
//
const machine: any = {
  context: {},
  id: 'A',
  initial: 'BD',
  states: {
    BD: {
      on: {
        NEXT: {
          target: 'END',
        },
      },
    },
    END: {},
  },
};

export default machine;
