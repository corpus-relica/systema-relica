import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { FactHandlers } from './handlers/fact.handlers';
import { SearchHandlers } from './handlers/search.handlers';
import { QueryHandlers } from './handlers/query.handlers';
import { ValidationHandlers } from './handlers/validation.handlers';
import { CompletionHandlers } from './handlers/completion.handlers';
import { ConceptHandlers } from './handlers/concept.handlers';
import { DefinitionHandlers } from './handlers/definition.handlers';
import { KindHandlers } from './handlers/kind.handlers';
import { SubmissionHandlers } from './handlers/submission.handlers';
import { TransactionHandlers } from './handlers/transaction.handlers';
import { UIDHandlers } from './handlers/uid.handlers';
import { LineageHandlers } from './handlers/lineage.handlers';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class ArchivistGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ArchivistGateway.name);
  private handlers = new Map<string, any>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly factHandlers: FactHandlers,
    private readonly searchHandlers: SearchHandlers,
    private readonly queryHandlers: QueryHandlers,
    private readonly validationHandlers: ValidationHandlers,
    private readonly completionHandlers: CompletionHandlers,
    private readonly conceptHandlers: ConceptHandlers,
    private readonly definitionHandlers: DefinitionHandlers,
    private readonly kindHandlers: KindHandlers,
    private readonly submissionHandlers: SubmissionHandlers,
    private readonly transactionHandlers: TransactionHandlers,
    private readonly uidHandlers: UIDHandlers,
    private readonly lineageHandlers: LineageHandlers,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.initializeHandlers();
  }

  private initializeHandlers() {
    // Register all handler methods
    this.factHandlers.init(this);
    this.searchHandlers.init(this);
    this.queryHandlers.init(this);
    this.validationHandlers.init(this);
    this.completionHandlers.init(this);
    this.conceptHandlers.init(this);
    this.definitionHandlers.init(this);
    this.kindHandlers.init(this);
    this.submissionHandlers.init(this);
    this.transactionHandlers.init(this);
    this.uidHandlers.init(this);
    this.lineageHandlers.init(this);
    
    this.logger.log(`Registered ${this.handlers.size} WebSocket handlers`);
  }

  registerHandler(event: string, handler: Function) {
    this.handlers.set(event, handler);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection:established', { 
      clientId: client.id, 
      server: 'archivist',
      capabilities: Array.from(this.handlers.keys())
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }

  @SubscribeMessage('health')
  handleHealth(@ConnectedSocket() client: Socket) {
    return { 
      event: 'health:status', 
      data: { 
        status: 'healthy',
        service: 'archivist',
        timestamp: Date.now(),
        handlers: Array.from(this.handlers.keys())
      } 
    };
  }

  // Dynamic handler dispatch using a catch-all decorator
  @SubscribeMessage(/.*/)
  async handleMessage(client: Socket, payload: any) {
    const { event, data } = payload;
    const handler = this.handlers.get(event);
    
    if (handler) {
      try {
        const result = await handler(data, client);
        client.emit(result.event, result.data);
      } catch (error) {
        client.emit('error', { 
          event: event,
          message: error.message 
        });
      }
    } else {
      client.emit('error', { 
        event: event,
        message: `Unknown event: ${event}` 
      });
    }
  }
}