import { Injectable, Logger } from '@nestjs/common';
import { WebSocket, WebSocketServer } from 'ws';
import { GellishBaseService } from '../gellish-base/gellish-base.service.js';

@Injectable()
export class WebSocketService {
  private wss: WebSocketServer;
  private logger = new Logger('WebSocketService');

  constructor(
    private readonly gellishBaseService: GellishBaseService,
  ) {}

  initialize(server: any) {
    this.wss = new WebSocketServer({ noServer: true });

    // Setup server-level handlers
    server.on('upgrade', (request, socket, head) => {
      if (request.url.startsWith('/ws')) {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.handleConnection(ws);
        });
      } else {
        socket.destroy();
      }
    });
  }

  private handleConnection(ws: WebSocket) {
    this.logger.log('New WebSocket connection');

    ws.on('message', async (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());
        const { id, type, payload } = message;

        this.logger.debug(`Received ${type} request:`, payload);

        // Handle different message types using injected services
        switch (type) {
          case 'getKinds':
            // const response = await this.kindsService.getKinds(payload);
            // ws.send(JSON.stringify({
            //   id,
            //   type: 'response',
            //   payload: response
            // }));
            ws.send(JSON.stringify({
              id,
              type: 'response',
              payload: `bitch ass muther fucker`
            }));
            break;

          case 'entities:resolve':
            // const result = await this.gellishBaseService.getEntities(JSON.parse(uids));
            // return result;
            ws.send(JSON.stringify({
              id,
              type: 'response',
              payload: `bitch ass muther fucker`
            }));
            break;

          default:
            ws.send(JSON.stringify({
              id,
              type: 'error',
              error: `Unknown request type: ${type}`
            }));
        }
      } catch (error) {
        this.logger.error('Error handling message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      this.logger.log('Client disconnected');
    });
  }
}
