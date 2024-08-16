// ROLE MACHINE
//
const machine: any = {
  context: {},
  id: 'R',
  initial: 'R',
  states: {
    R: {
      initial: 'SRP',
      states: {
        SRP: {
          on: {
            FINALIZE: {
              target: '#R.END',
            },
            X: {
              target: '#R.R_DNKPO',
            },
          },
        },
        HIST: {
          type: 'history',
        },
      },
    },
    END: {
      type: 'final',
    },
    R_DNKPO: {
      on: {
        RETURN: {
          target: '#R.R.HIST',
        },
      },
    },
  },
};

export default machine;
