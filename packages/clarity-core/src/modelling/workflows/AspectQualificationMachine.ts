// ASPECT QUALIFICATION MACHINE
//
const machine: any = {
  context: {},
  id: 'QA',
  initial: 'BD',
  states: {
    BD: {
      on: {
        NEXT: {
          target: 'QQA',
        },
      },
    },
    QQA: {
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
