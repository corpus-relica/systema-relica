import { Express } from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

class SocketServer {
  _io: Server | null = null;

  constructor() {}

  init(server: any) {
    this._io = new Server(server, {
      cors: {
        origin: "*", // Allow your client application's origin
        methods: ["GET", "POST"], // Allowed request methods
      },
    });
  }

  emit(role: string, type: string, payload: any, callback?: (response: any) => void) {
    if (!this._io) {
      console.error("Socket.io server not initialized");
      return;
    }

    const io = this._io;
    if (!callback) {
      io.emit(`${role}:${type}`, payload);
    }else{
      return new Promise((resolve, reject) => {
        // Wrap the callback (if provided) to resolve the promise
        const callbackWrapper = (response:any) => {
          if (callback) callback(response);
          console.log('response: ', response)
          resolve(response);
        };

        // Emit the event and pass the callbackWrapper
        io.emit(`${role}:${type}`, payload, callbackWrapper);
      });
    }
  }

  get io() {
    return this._io;
  }
}

const socketServer = new SocketServer();
export default socketServer;
