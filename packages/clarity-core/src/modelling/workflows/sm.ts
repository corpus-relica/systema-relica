export const machine: any = {
  id: 'DM',
  initial: 'BD',
  states: {
    BD: {
      //@ts-ignore
      entry: [{ type: 'populateContext', data: 'BD' }],
      on: {
        IA: {
          target: 'IA',
        },
        R: {
          target: 'R',
        },
        PO: {
          target: 'PO',
        },
        FINALIZE: {
          target: 'END',
        },
      },
    },
    IA: {
      initial: 'SRPA',
      states: {
        SRPA: {
          //@ts-ignore
          entry: [{ type: 'populateContext', data: 'SRPA' }],
          on: {
            NEXT: {
              target: 'SPPO',
            },
            X: {
              target: '#DM.DNKA',
            },
          },
        },
        SPPO: {
          on: {
            FINALIZE: {
              target: '#DM.END',
            },
            Y: {
              target: '#DM.IA_DNKPO',
            },
          },
        },
        HIST: {
          type: 'history',
        },
      },
    },
    R: {
      initial: 'SRP',
      states: {
        SRP: {
          on: {
            FINALIZE: {
              target: '#DM.END',
            },
            X: {
              target: '#DM.R_DNKPO',
            },
          },
        },
        HIST: {
          type: 'history',
        },
      },
    },
    PO: {
      initial: 'SDQA',
      states: {
        SDQA: {
          on: {
            NEXT: {
              target: 'SDNIA',
            },
            X: {
              target: '#DM.DNQualA',
            },
          },
        },
        SDNIA: {
          on: {
            NEXT: {
              target: 'SDVIA',
            },
            X: {
              target: '#DM.DNIA',
            },
          },
        },
        SDVIA: {
          on: {
            NEXT: {
              target: 'SIF',
            },
            X: {
              target: '#DM.DNQuantA',
            },
          },
        },
        SIF: {
          on: {
            NEXT: {
              target: 'SC',
            },
            X: {
              target: '#DM.DNKO',
            },
          },
        },
        SC: {
          on: {
            NEXT: {
              target: 'DGO',
            },
            CREATE_CONTAINER: {
              target: '#DM.CCRPO',
            },
            CREATE_CONTAINED: {
              target: '#DM.CCDPO',
            },
          },
        },
        DGO: {
          on: {
            NEXT: {
              target: 'DTO',
            },
            UPLOAD: {
              target: '#DM.DGO_UCIF',
            },
            DEF_PICTURE: {
              target: '#DM.DGO_DPS',
            },
          },
        },
        DTO: {
          on: {
            NEXT: {
              target: 'ITM',
            },
            UPLOAD: {
              target: '#DM.DTO_UCTF',
            },
            DEF_INFO: {
              target: '#DM.DTO_DIS',
            },
          },
        },
        ITM: {
          on: {
            FINALIZE: {
              target: '#DM.END',
            },
            DEF_INFO: {
              target: '#DM.DTO_DIS',
            },
          },
        },
        Hist: {
          entry: ({ context, event }) => {
            console.log('ACTION, context:', context, 'event:', event);
          },
          type: 'history',
        },
      },
    },
    END: {
      type: 'final',
    },
    DNQualA: {
      on: {
        RETURN: {
          target: '#DM.PO.Hist',
        },
      },
    },
    DNIA: {
      on: {
        RETURN: {
          target: '#DM.PO.Hist',
        },
      },
    },
    DNQuantA: {
      on: {
        RETURN: {
          target: '#DM.PO.Hist',
        },
      },
    },
    DNKO: {
      on: {
        RETURN: {
          target: '#DM.PO.Hist',
        },
      },
    },
    CCRPO: {
      on: {
        RETURN: {
          target: '#DM.PO.Hist',
        },
      },
    },
    CCDPO: {
      on: {
        RETURN: {
          target: '#DM.PO.Hist',
        },
      },
    },
    DGO_UCIF: {
      on: {
        RETURN: {
          target: '#DM.PO.Hist',
        },
      },
    },
    DGO_DPS: {
      on: {
        RETURN: {
          target: '#DM.PO.Hist',
        },
      },
    },
    DTO_DIS: {
      on: {
        RETURN: {
          target: '#DM.PO.Hist',
        },
      },
    },
    DTO_UCTF: {
      on: {
        RETURN: {
          target: '#DM.PO.Hist',
        },
      },
    },
    R_DNKPO: {
      on: {
        RETURN: {
          target: '#DM.R.HIST',
        },
      },
    },
    IA_DNKPO: {
      on: {
        RETURN: {
          target: '#DM.IA.HIST',
        },
      },
    },
    DNKA: {
      on: {
        RETURN: {
          target: '#DM.IA.HIST',
        },
      },
    },
  },
  types: {
    events: {} as
      | { type: 'R' }
      | { type: 'X' }
      | { type: 'IA' }
      | { type: 'PO' }
      | { type: 'NEXT' }
      | { type: 'UPLOAD' }
      | { type: 'RETURN' }
      | { type: 'CREATE_CONTAINER' }
      | { type: 'CREATE_CONTAINED' }
      | { type: 'DEF_PICTURE' }
      | { type: 'DEF_INFO' }
      | { type: 'Y' }
      | { type: 'FINALIZE' },
  },
};
