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
    private readonly semanticModelService: SemanticModelService,
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

  // LEGACY //

  @SubscribeMessage('user:selectEntity')
  userSelectEntity(@MessageBody('uid') uid: number): number {
    console.log('SELECT ENTITY');
    console.log(uid);
    this.environmentService.setSelectedEntity(uid, 'entity');
    this.server.emit('system:selectEntity', { uid: uid });
    return uid;
  }

  @SubscribeMessage('user:selectFact')
  userSelectFact(@MessageBody('uid') uid: any): number {
    console.log('SELECT FACT');
    console.log(uid);
    this.environmentService.setSelectedEntity(uid, 'fact');
    this.server.emit('system:selectFact', { uid: uid });
    return uid;
  }

  @SubscribeMessage('user:selectNone')
  userSelectNone(): Promise<number> {
    console.log('SELECT NONE');
    this.environmentService.setSelectedEntity(null);
    this.server.emit('system:selectedNone', {});
    return null;
  }

  @SubscribeMessage('user:getSubtypes')
  async userGetSubtypes(@MessageBody('uid') uid: any): Promise<number> {
    console.log('GET SUBTYPES');
    console.log(uid);
    const res = await this.environmentService.getSubtypes(uid);
    this.server.emit('system:addFacts', res);
    return uid;
  }

  @SubscribeMessage('user:getSubtypesCone')
  async userGetSubtypesCone(@MessageBody('uid') uid: any): Promise<number> {
    console.log('GET SUBTYPES CONE');
    console.log(uid);
    const res = await this.environmentService.getSubtypesCone(uid);
    this.server.emit('system:addFacts', res);
    return uid;
  }

  @SubscribeMessage('user:getSpecializationHierarchy')
  async userGetSpecializationHierarchy(
    @MessageBody('uid') uid: number,
  ): Promise<any> {
    console.log('GET SPECIALIZATION HIERARCHY: ', uid);

    const result = await this.archivistService.getSpecializationHierarchy(uid);
    const facts = result.facts;
    const models = await this.environmentService.modelsFromFacts(facts);

    this.environmentService.insertFacts(facts);
    this.environmentService.insertModels(models);

    const payload = { facts, models };
    this.server.emit('system:addFacts', payload);
    return payload;
  }

  @SubscribeMessage('user:loadEntity')
  async userLoadEntity(@MessageBody('uid') uid: number): Promise<number> {
    console.log('LOAD ENTITY');
    console.log(uid);
    const payload = await this.environmentService.loadEntity(uid);
    this.server.emit('system:addFacts', payload);
    return uid;
  }

  @SubscribeMessage('user:loadEntities')
  async userLoadEntities(@MessageBody('uids') uids: number[]): Promise<any> {
    console.log('LOAD ENTITIES');
    console.log(uids, typeof uids);
    let facts: Fact[] = [];
    let models: any[] = [];
    for (let i = 0; i < uids.length; i++) {
      const payload = await this.environmentService.loadEntityBase(uids[i]);
      facts = facts.concat(payload.facts);
      models = models.concat(payload.models);
    }
    const payload = { facts, models };
    this.server.emit('system:addFacts', payload);
    return payload;
  }

  @SubscribeMessage('user:removeEntity')
  async userRemoveEntity(@MessageBody('uid') uid: number): Promise<number> {
    console.log('REMOVE ENTITY');
    console.log(uid);
    const removedFactUids = await this.environmentService.removeEntity(uid);
    this.server.emit('system:remFacts', { fact_uids: removedFactUids });
    return uid;
  }

  @SubscribeMessage('user:removeEntities')
  async userRemoveEntities(
    @MessageBody('uids') uids: number[],
  ): Promise<number[]> {
    console.log('REMOVE ENTITIES');
    console.log(uids);
    const removedFactUids = await this.environmentService.removeEntities(uids);
    this.server.emit('system:remFacts', { fact_uids: removedFactUids });
    return uids;
  }

  @SubscribeMessage('user:clearEntities')
  userClearEntities(): Promise<number> {
    console.log('CLEAR ENTITIES');
    this.environmentService.clearEntities();

    this.server.emit('system:entitiesCleared', {});

    return null;
  }

  @SubscribeMessage('user:deleteEntity')
  async userDeleteEntity(@MessageBody('uid') uid: number): Promise<number> {
    console.log('DELETE ENTITY');
    console.log(uid);
    const result = await this.archivistService.deleteEntity(uid);
    //if result is success
    console.log('DELETE ENTITY RESULT', result);
    const removedFactUids = await this.environmentService.removeEntity(uid);
    // console.log("Entity deleted");

    this.server.emit('system:remFacts', { fact_uids: removedFactUids });
    return uid;
  }

  @SubscribeMessage('user:removeFact')
  async userRemoveFact(@MessageBody('uid') uid: number): Promise<number> {
    console.log('REMOVE FACT');
    console.log(uid);
    await this.environmentService.removeFact(uid);
    this.server.emit('system:remFacts', { fact_uids: [uid] });
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

  @SubscribeMessage('user:removeEntitySubtypesRecursive')
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
    this.server.emit('system:remFacts', { fact_uids: factUIDsToRemove });
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

  @SubscribeMessage('user:getAllRelatedFacts')
  async userGetAllRelatedFacts(@MessageBody('uid') uid: number): Promise<any> {
    console.log('GET ALL RELATED FACTS');
    console.log(uid, typeof uid);

    const result = await this.archivistService.retrieveAllFacts(uid);
    const models = await this.environmentService.modelsFromFacts(result);

    await this.environmentService.insertFacts(result);
    await this.environmentService.insertModels(models);

    this.server.emit('system:addFacts', { facts: result, models });

    return { facts: result, models };
  }
}
