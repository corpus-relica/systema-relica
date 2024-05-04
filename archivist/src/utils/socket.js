let socket;

export const setSocket = (io) => {
  socket = io;
};

export const getSocket = () => {
  return socket;
};

export const emit = (role, type, payload) => {
  socket.emit("message", { role, type, payload });
};
