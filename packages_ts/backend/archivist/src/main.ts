import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { Logger } from '@nestjs/common';
import { WebSocketServer } from 'ws';
import { parseEDNString, toEDNStringFromSimpleObject } from 'edn-data'

import { WebSocketService } from './websocket/websocket.service.js';

console.log('main.ts');

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Get WebSocket service from DI container
  const wsService = app.get(WebSocketService);

  // Initialize with HTTP server
  wsService.initialize(app.getHttpServer());

  // Create HTTP server instance
  // const server = app.getHttpServer();

  // Create WebSocket server
  // const wss = new WebSocketServer({ noServer: true });

 // Track active connections
  // const connections = new Map();

// server.on('upgrade', (request, socket, head) => {
//     logger.debug('Upgrade request:', request.url);

//     if (request.url.startsWith('/ws')) {
//       wss.handleUpgrade(request, socket, head, (ws) => {
//         const clientId = Math.random().toString(36).substr(2, 9);
//         logger.log(`WebSocket connection established for client ${clientId}`);

//         // Store connection
//         connections.set(clientId, {
//           ws,
//           lastPong: Date.now(),
//           isAlive: true
//         });

//         // Handle incoming messages
//         ws.on('message', (message) => {
//           try {
//             const msg = JSON.parse(message.toString());
//             logger.debug(`Received message from ${clientId}:`, msg);

//             const { id, type, payload } = msg;

//             // Process different request types
//             switch (type) {
//               case 'getKinds':
//                 // Example response
//                 const response = {
//                   id,
//                   type: 'response',
//                   payload: {
//                     status: 'ok',
//                     data: {
//                       kinds: [],
//                       total: 0
//                     }
//                   }
//                 };
//                 ws.send(JSON.stringify(response));
//                 break;

//               case 'ping':
//                 ws.send(JSON.stringify({
//                   id,
//                   type: 'pong'
//                 }));
//                 break;

//               case 'message':
//                 ws.send(JSON.stringify({
//                   id,
//                   type: 'response',
//                   payload: {
//                     message: 'Received message in response to: ' +payload
//                   }
//                 }));
//                 break;

//               default:
//                 ws.send(JSON.stringify({
//                   id,
//                   type: 'error',
//                   payload: {
//                     message: `Unknown request type: ${type}`
//                   }
//                 }));
//             }
//           } catch (error) {
//             logger.error('Error processing message:', error);
//             // Try to send error response if we can parse an ID
//             try {
//               const { id } = JSON.parse(message.toString());
//               ws.send(JSON.stringify({
//                 id,
//                 type: 'error',
//                 payload: {
//                   message: 'Error processing request'
//                 }
//               }));
//             } catch {
//               // If we can't even get the ID, send a generic error
//               ws.send(JSON.stringify({
//                 type: 'error',
//                 payload: {
//                   message: 'Invalid message format'
//                 }
//               }));
//             }
//           }
//         });

//         // Set up ping-pong
//         ws.on('pong', () => {
//           logger.debug(`Raw pong from ${clientId}`);
//           const conn = connections.get(clientId);
//           if (conn) {
//             conn.isAlive = true;
//             conn.lastPong = Date.now();
//           }
//         });

//         ws.on('close', () => {
//           logger.debug(`Client ${clientId} disconnected`);
//           connections.delete(clientId);
//         });

//         ws.on('error', (error) => {
//           logger.error(`Error for client ${clientId}:`, error);
//         });
//       });
//     } else {
//       logger.warn('Invalid WebSocket path:', request.url);
//       socket.destroy();
//     }
//   });

  // Health check interval
  // const healthCheck = setInterval(() => {
  //   connections.forEach((conn, clientId) => {
  //     if (Date.now() - conn.lastPong > 35000) {
  //       logger.warn(`Client ${clientId} timed out`);
  //       conn.ws.terminate();
  //       connections.delete(clientId);
  //       return;
  //     }

  //     if (!conn.isAlive) {
  //       logger.warn(`Client ${clientId} not responding`);
  //       conn.ws.terminate();
  //       connections.delete(clientId);
  //       return;
  //     }

  //     conn.isAlive = false;
  //     conn.ws.ping();
  //   });
  // }, 25000);

  // wss.on('close', () => {
  //   clearInterval(healthCheck);
  // });

  const config = new DocumentBuilder()
    .setTitle('Relica Archivist API')
    .setDescription(
      'The Relica Archivist API, for managing and querying the Relica Archivist database.',
    )
    .setVersion('1.0')
    .addTag('archivist')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'range'],
    exposedHeaders: ['Content-Range'],
  });

  await app.listen(3000, '0.0.0.0');
  logger.log('Application started on port 3000');
}

bootstrap();
