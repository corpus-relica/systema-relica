import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object
// const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:4000';
console.log(
  "CONNECTING SOCKET ??? ",
  import.meta.env.VITE_RELICA_CC_SOCKET_URL
);

export const ccSocket = io(import.meta.env.VITE_RELICA_CC_SOCKET_URL, {
  query: {
    clientName: "INTEGRATOR",
  },
});

// export const nousSocket = io(import.meta.env.VITE_RELICA_NOUS_SOCKET_URL);

// export const nousSocket = {
//   on: (x, y) => {},
//   off: (x, y) => {},
//   emit: (x, y) => {},
// };

export const sockSendCC = (role, type, payload) => {
  if (ccSocket) {
    //ts-ignore next line
    ccSocket.emit(`${role}:${type}`, payload);
  }
};

export const sockSendNous = (role, content) => {
  if (nousSocket) {
    //ts-ignore next line
    nousSocket.emit("message", { role, content });
  }
};
