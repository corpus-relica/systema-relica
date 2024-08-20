// ASPECT MACHINE
//
const machine: any = {
  context: {},
  id: 'DNKA',
  initial: 'BD',
  states: {
    BD: {
      on: {
        NEXT: {
          target: 'SPA',
        },
      },
    },
    SPA: {
      on: {
        NEXT: {
          target: 'SQCA',
        },
      },
    },
    SQCA: {
      on: {
        NEXT: {
          target: 'END',
        },
        QuantQualAsp: {
          target: 'QQA',
        },
      },
    },
    END: {
      type: 'final',
    },
    QQA: {
      on: {
        NEXT: {
          target: 'SQCA',
        },
      },
    },
  },
};

export default machine;
