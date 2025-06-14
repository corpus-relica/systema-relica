import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import { ArchivistService } from '../archivist/archivist.service';
import { Logger } from '@nestjs/common';
import { Fact } from '@relica/types';
import { REPLService } from 'src/repl/repl.service';

// import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  private logger: Logger = new Logger('EventsGateway');

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly archivistService: ArchivistService,
    private readonly repl: REPLService,
    // private readonly eventEmitter: EventEmitter2,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // You can emit a welcome message or initial data here
    client.emit('connection', { message: 'Successfully connected to server' });
    // Optionally broadcast to other clients that a new client has joined
    client.broadcast.emit('clientJoined', { clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Optionally broadcast to other clients that a client has left
    this.server.emit('clientLeft', { clientId: client.id });
  }

  // EVENT HANDLER //
  // Moved to Aperture service
  // @OnEvent('emit')
  // async handleAddFacts(payload: any) {
  //   this.logger.log('EMIT:', payload.type);
  //   this.server.emit(payload.type, payload.payload);
  // }

  // NOUS //

  @SubscribeMessage('nous:selectEntity')
  async nouseSelectEntity(@MessageBody('uid') uid: number): Promise<number> {
    console.log('NOUS:SELECT ENTITY', uid);

    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(selectEntity ${uid})`, resolve);
    });
    // this.server.emit('system:selectEntity', { uid: uid });

    return result;
  }

  @SubscribeMessage('nous:loadEntity')
  async nouseLoadEntity(@MessageBody('uid') uid: number): Promise<any> {
    console.log('NOUS:LOAD ENTITY', uid);
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(loadEntity ${uid})`, resolve);
    });
    return result;
  }

  // COMMAND //

  // @SubscribeMessage('system:command')
  // async systemCommand(@MessageBody('command') command: string): Promise<void> {
  //   this.logger.log('SYSTEM:COMMAND');
  //   const parsedCommand = this.dslParser.parse(command);
  //   await this.vmExecutor.execute(parsedCommand);

  //   // const newState = await this.stateStore.getState();
  //   return;
  // }

  // CLIENT(knowledge-integrator) REPL
  @SubscribeMessage('repl:eval')
  async replEval(@MessageBody('command') command: string): Promise<string> {
    this.logger.log('REPL:EVAL');
    this.logger.log(command);

    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(command, resolve);
    });

    console.log('REPL:EVAL RESULT', result);
    return result;
  }

  // LEGACY //

  @SubscribeMessage('user:selectEntity')
  async userSelectEntity(@MessageBody('uid') uid: number): Promise<number> {
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(selectEntity ${uid})`, resolve);
    });

    return result;
  }

  @SubscribeMessage('user:selectFact')
  async userSelectFact(@MessageBody('uid') uid: any): Promise<number> {
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(selectFact ${uid})`, resolve);
    });

    return result;
  }

  @SubscribeMessage('user:selectNone')
  async userSelectNone(): Promise<number> {
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(selectNone)`, resolve);
    });

    return result;
  }

  @SubscribeMessage('user:loadSubtypesCone')
  async userGetSubtypesCone(@MessageBody('uid') uid: any): Promise<number> {
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(loadSubtypesCone ${uid})`, resolve);
    });

    return result;
  }

  @SubscribeMessage('user:loadSpecializationHierarchy')
  async userLoadSpecializationHierarchy(
    @MessageBody('uid') uid: number,
  ): Promise<any> {
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(loadSpecializationHierarchy ${uid})`, resolve);
    });

    return result;
  }

  @SubscribeMessage('user:loadEntity')
  async userLoadEntity(@MessageBody('uid') uid: number): Promise<number> {
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(loadEntity ${uid})`, resolve);
    });
    return result;
  }

  @SubscribeMessage('user:loadEntities')
  async userLoadEntities(@MessageBody('uids') uids: number[]): Promise<any> {
    const loadUidsStr = uids.join(' ');
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(loadEntities [${loadUidsStr}])`, resolve);
    });
    return result;
  }

  @SubscribeMessage('user:unloadEntity')
  async userUnloadEntity(@MessageBody('uid') uid: number): Promise<number> {
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(unloadEntity ${uid})`, resolve);
    });
    return result;
  }

  @SubscribeMessage('user:unloadEntities')
  async userUnloadEntities(
    @MessageBody('uids') uids: number[],
  ): Promise<number[]> {
    const loadUidsStr = uids.join(' ');
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(unloadEntities [${loadUidsStr}])`, resolve);
    });
    return result;
  }

  @SubscribeMessage('user:clearEntities')
  async userClearEntities(): Promise<void> {
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(clearEntities)`, resolve);
    });
    return;
  }


  // @SubscribeMessage('user:unloadSubtypesCone')
  // async userRemoveEntitySubtypesRecursive(
  //   @MessageBody('uid') uid: number,
  // ): Promise<number> {
  //   console.log('REMOVE ENTITY SUBTYPES RECURSIVE');
  //   console.log(uid);
  //   console.log('>// REMOVE ENTITY DESCENDANTS');
  //   const env = await this.environmentService.retrieveEnvironment();
  //   const facts = env.facts;
  //   let factsToRemove: Fact[] = [];
  //   let remainingFacts: Fact[] = [];
  //   facts.forEach((fact: Fact) => {
  //     if (/* fact.lh_object_uid === uid || */ fact.rh_object_uid === uid) {
  //       factsToRemove.push(fact);
  //     } else {
  //       remainingFacts.push(fact);
  //     }
  //   });
  //   let factUIDsToRemove: number[] = [];
  //   let candidateModelUIDsToRemove: Set<number> = new Set();
  //   factsToRemove.forEach((fact: Fact) => {
  //     factUIDsToRemove.push(fact.fact_uid);
  //     candidateModelUIDsToRemove.add(fact.lh_object_uid);
  //     candidateModelUIDsToRemove.add(fact.rh_object_uid);
  //   });
  //   remainingFacts.forEach((fact: Fact) => {
  //     if (candidateModelUIDsToRemove.has(fact.lh_object_uid)) {
  //       candidateModelUIDsToRemove.delete(fact.lh_object_uid);
  //     }
  //     if (candidateModelUIDsToRemove.has(fact.rh_object_uid)) {
  //       candidateModelUIDsToRemove.delete(fact.rh_object_uid);
  //     }
  //   });
  //   this.environmentService.removeFacts(factUIDsToRemove);
  //   // TODO: i don't think all the models needing to be removed are being removed
  //   this.environmentService.removeModels(
  //     Array.from(candidateModelUIDsToRemove),
  //   );
  //   // this.server.emit('system:unloadedFacts', { fact_uids: factUIDsToRemove });
  //   const subtypingFacts = factsToRemove.filter(
  //     (fact: Fact) => fact.rel_type_uid === 1146 && fact.rh_object_uid === uid,
  //   );
  //   console.log('SUBTYPING FACTS: ', subtypingFacts);
  //   subtypingFacts.forEach((fact: Fact) => {
  //     console.log('>>> RECURSE ON: ', fact.lh_object_uid);
  //     this.userRemoveEntitySubtypesRecursive(fact.lh_object_uid);
  //   });

  //   return uid;
  // }


  @SubscribeMessage('user:loadAllRelatedFacts')
  async userGetAllRelatedFacts(@MessageBody('uid') uid: number): Promise<any> {
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(loadAllRelatedFacts ${uid})`, resolve);
    });
    return result;
  }
}
