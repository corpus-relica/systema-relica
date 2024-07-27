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
import { SemanticModelService } from '../semanticModel/semanticModel.service';

import {
  SELECT_ENTITY,
  SELECT_FACT,
  SELECT_NONE,
  LOAD_SUBTYPES_CONE,
  LOAD_SPECIALIZATION_HIERARCHY,
  UNLOAD_ENTITY,
  LOAD_ENTITY,
  LOAD_ENTITIES,
  UNLOAD_ENTITIES,
  CLEAR_ENTITIES,
  LOAD_ALL_RELATED,
  REPL_EVAL,
} from '../semanticModel/actions';
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
    private readonly semanticModel: SemanticModelService,
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
  replEval(@MessageBody('command') command: string): string {
    this.logger.log('REPL:EVAL');
    this.logger.log(command);

    this.semanticModel.dispatch({
      type: REPL_EVAL,
      payload: { command },
    });
    return command;
  }

  // LEGACY //

  @SubscribeMessage('user:selectEntity')
  userSelectEntity(@MessageBody('uid') uid: number): number {
    this.semanticModel.dispatch({
      type: SELECT_ENTITY,
      payload: { uid },
    });
    return uid;
  }

  @SubscribeMessage('user:selectFact')
  userSelectFact(@MessageBody('uid') uid: any): number {
    this.semanticModel.dispatch({
      type: SELECT_FACT,
      payload: { uid },
    });
    return uid;
  }

  @SubscribeMessage('user:selectNone')
  userSelectNone(): Promise<number> {
    this.semanticModel.dispatch({
      type: SELECT_NONE,
      payload: null,
    });
    return null;
  }

  @SubscribeMessage('user:loadSubtypesCone')
  async userGetSubtypesCone(@MessageBody('uid') uid: any): Promise<number> {
    this.semanticModel.dispatch({
      type: LOAD_SUBTYPES_CONE,
      payload: { uid },
    });
    return uid;
  }

  @SubscribeMessage('user:loadSpecializationHierarchy')
  async userLoadSpecializationHierarchy(
    @MessageBody('uid') uid: number,
  ): Promise<any> {
    this.semanticModel.dispatch({
      type: LOAD_SPECIALIZATION_HIERARCHY,
      payload: { uid },
    });
    return;
  }

  @SubscribeMessage('user:loadEntity')
  async userLoadEntity(@MessageBody('uid') uid: number): Promise<number> {
    this.semanticModel.dispatch({
      type: LOAD_ENTITY,
      payload: { uid },
    });
    return uid;
  }

  @SubscribeMessage('user:loadEntities')
  async userLoadEntities(@MessageBody('uids') uids: number[]): Promise<any> {
    this.semanticModel.dispatch({
      type: LOAD_ENTITIES,
      payload: { uids },
    });
    return uids;
  }

  @SubscribeMessage('user:unloadEntity')
  async userRemoveEntity(@MessageBody('uid') uid: number): Promise<number> {
    this.semanticModel.dispatch({
      type: UNLOAD_ENTITY,
      payload: { uid },
    });
    return uid;
  }

  @SubscribeMessage('user:unloadEntities')
  async userRemoveEntities(
    @MessageBody('uids') uids: number[],
  ): Promise<number[]> {
    this.semanticModel.dispatch({
      type: UNLOAD_ENTITIES,
      payload: { uids },
    });
    return uids;
  }

  @SubscribeMessage('user:clearEntities')
  userClearEntities(): Promise<number> {
    this.semanticModel.dispatch({
      type: CLEAR_ENTITIES,
      payload: {},
    });

    return null;
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
    this.semanticModel.dispatch({
      type: LOAD_ALL_RELATED,
      payload: { uid },
    });

    return null;
  }
}
