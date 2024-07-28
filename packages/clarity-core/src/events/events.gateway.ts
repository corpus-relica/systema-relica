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
import { EnvironmentService } from '../environment/environment.service';
import { ArchivistService } from '../archivist/archivist.service';
import { Logger } from '@nestjs/common';
import { Fact } from '@relica/types';
import { REPLService } from 'src/repl/repl.service';

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

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
    private readonly environmentService: EnvironmentService,
    private readonly archivistService: ArchivistService,
    private readonly repl: REPLService,
    private readonly eventEmitter: EventEmitter2,
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

  @OnEvent('emit')
  async handleAddFacts(payload: any) {
    this.logger.log('EMIT:', payload.type);
    this.server.emit(payload.type, payload.payload);
  }

  // NOUS //

  @SubscribeMessage('nous:selectEntity')
  nouseSelectEntity(@MessageBody('uid') uid: number): number {
    console.log('NOUS:SELECT ENTITY', uid);
    this.environmentService.setSelectedEntity(uid);
    this.server.emit('system:selectEntity', { uid: uid });
    return uid;
  }

  @SubscribeMessage('nous:loadEntity')
  async nouseLoadEntity(@MessageBody('uid') uid: number): Promise<any> {
    // socket.on("nous:loadEntity", async (d: { uid: number }, cbk: any) => {
    console.log('NOUS:LOAD ENTITY');
    console.log(uid);
    const res = await this.environmentService.loadEntity(uid);
    console.log(res);
    // if (cbk) {
    //   cbk(res);
    // }
    return res;
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
    const result = await this.repl.exec(command);
    return result;
  }

  // LEGACY //

  @SubscribeMessage('user:selectEntity')
  async userSelectEntity(@MessageBody('uid') uid: number): Promise<number> {
    const result = await this.repl.exec(`(selectEntity ${uid})`);
    return result;
  }

  @SubscribeMessage('user:selectFact')
  async userSelectFact(@MessageBody('uid') uid: any): Promise<number> {
    const result = await this.repl.exec(`(selectFact ${uid})`);
    return result;
  }

  @SubscribeMessage('user:selectNone')
  async userSelectNone(): Promise<number> {
    const result = await this.repl.exec(`(selectNone)`);
    return result;
  }

  @SubscribeMessage('user:loadSubtypesCone')
  async userGetSubtypesCone(@MessageBody('uid') uid: any): Promise<number> {
    const result = await this.repl.exec(`(loadSubtypesCone ${uid})`);
    return result;
  }

  @SubscribeMessage('user:loadSpecializationHierarchy')
  async userLoadSpecializationHierarchy(
    @MessageBody('uid') uid: number,
  ): Promise<any> {
    const result = await this.repl.exec(`(loadSpecializationHierarchy ${uid})`);
    return result;
  }

  @SubscribeMessage('user:loadEntity')
  async userLoadEntity(@MessageBody('uid') uid: number): Promise<number> {
    const result = await this.repl.exec(`(loadEntity ${uid})`);
    return result;
  }

  @SubscribeMessage('user:loadEntities')
  async userLoadEntities(@MessageBody('uids') uids: number[]): Promise<any> {
    const loadUidsStr = uids.join(' ');
    const result = await this.repl.exec(`(loadEntities [${loadUidsStr}])`);
    return result;
  }

  @SubscribeMessage('user:unloadEntity')
  async userUnloadEntity(@MessageBody('uid') uid: number): Promise<number> {
    const result = await this.repl.exec(`(unloadEntity ${uid})`);
    return result;
  }

  @SubscribeMessage('user:unloadEntities')
  async userUnloadEntities(
    @MessageBody('uids') uids: number[],
  ): Promise<number[]> {
    const loadUidsStr = uids.join(' ');
    const result = await this.repl.exec(`(unloadEntities [${loadUidsStr}])`);
    return result;
  }

  @SubscribeMessage('user:clearEntities')
  async userClearEntities(): Promise<void> {
    const result = await this.repl.exec(`(clearEntities)`);
    return;
  }

  @SubscribeMessage('user:deleteEntity')
  async userDeleteEntity(@MessageBody('uid') uid: number): Promise<number> {
    console.log('DELETE ENTITY');
    console.log(uid);
    const result = await this.archivistService.deleteEntity(uid);
    //if result is success
    console.log('DELETE ENTITY RESULT', result);
    const removedFactUids = await this.environmentService.unloadEntity(uid);
    // console.log("Entity deleted");

    this.server.emit('system:remFacts', { fact_uids: removedFactUids });
    return uid;
  }

  @SubscribeMessage('user:deleteFact')
  async userDeleteFact(@MessageBody('uid') uid: number): Promise<number> {
    console.log('DELETE FACT');
    console.log(uid);

    const result = await this.archivistService.deleteFact(uid);
    //if result is success
    console.log('DELETE FACT RESULT', result);
    this.environmentService.removeFact(uid);
    // console.log("Fact deleted");

    this.server.emit('system:remFacts', { fact_uids: [uid] });
    return uid;
  }

  @SubscribeMessage('user:unloadSubtypesCone')
  async userRemoveEntitySubtypesRecursive(
    @MessageBody('uid') uid: number,
  ): Promise<number> {
    console.log('REMOVE ENTITY SUBTYPES RECURSIVE');
    console.log(uid);
    console.log('>// REMOVE ENTITY DESCENDANTS');
    const env = await this.environmentService.retrieveEnvironment();
    const facts = env.facts;
    let factsToRemove: Fact[] = [];
    let remainingFacts: Fact[] = [];
    facts.forEach((fact: Fact) => {
      if (/* fact.lh_object_uid === uid || */ fact.rh_object_uid === uid) {
        factsToRemove.push(fact);
      } else {
        remainingFacts.push(fact);
      }
    });
    let factUIDsToRemove: number[] = [];
    let candidateModelUIDsToRemove: Set<number> = new Set();
    factsToRemove.forEach((fact: Fact) => {
      factUIDsToRemove.push(fact.fact_uid);
      candidateModelUIDsToRemove.add(fact.lh_object_uid);
      candidateModelUIDsToRemove.add(fact.rh_object_uid);
    });
    remainingFacts.forEach((fact: Fact) => {
      if (candidateModelUIDsToRemove.has(fact.lh_object_uid)) {
        candidateModelUIDsToRemove.delete(fact.lh_object_uid);
      }
      if (candidateModelUIDsToRemove.has(fact.rh_object_uid)) {
        candidateModelUIDsToRemove.delete(fact.rh_object_uid);
      }
    });
    this.environmentService.removeFacts(factUIDsToRemove);
    this.environmentService.removeModels(
      Array.from(candidateModelUIDsToRemove),
    );
    this.server.emit('system:unloadedFacts', { fact_uids: factUIDsToRemove });
    const subtypingFacts = factsToRemove.filter(
      (fact: Fact) => fact.rel_type_uid === 1146 && fact.rh_object_uid === uid,
    );
    console.log('SUBTYPING FACTS: ', subtypingFacts);
    subtypingFacts.forEach((fact: Fact) => {
      console.log('>>> RECURSE ON: ', fact.lh_object_uid);
      this.userRemoveEntitySubtypesRecursive(fact.lh_object_uid);
    });

    return uid;
  }

  @SubscribeMessage('user:loadAllRelatedFacts')
  async userGetAllRelatedFacts(@MessageBody('uid') uid: number): Promise<any> {
    const result = await this.repl.exec(`(loadAllRelatedFacts ${uid})`);
    return result;
  }
}
