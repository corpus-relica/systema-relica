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

  //

  @SubscribeMessage('nous:selectEntity')
  nouseSelectEntity(@MessageBody() data: any): Promise<number> {
    console.log('NOUS:SELECT ENTITY');
    console.log(data);
    // setSelectedEntity(d.uid);
    // socketServer.emit('system', 'selectEntity', { uid: d.uid });
    return data;
  }

  @SubscribeMessage('nous:loadEntity')
  async nouseLoadEntity(@MessageBody() data: any): Promise<number> {
    // socket.on("nous:loadEntity", async (d: { uid: number }, cbk: any) => {
    console.log('NOUS:LOAD ENTITY');
    console.log(data);
    // const res = await loadEntity(d.uid);
    // console.log(res);
    // if (cbk) {
    //   cbk(res);
    // }
    return data;
  }

  //

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
    // socketServer.emit('system', 'selectedNone', {});
    return null;
  }

  @SubscribeMessage('user:getSubtypes')
  userGetSubtypes(@MessageBody() data: any): Promise<number> {
    console.log('GET SUBTYPES');
    console.log(data);
    // this.environmentService.getSubtypes(d.uid);
    return data;
  }

  @SubscribeMessage('user:getSubtypesCone')
  userGetSubtypesCone(@MessageBody() data: any): Promise<number> {
    console.log('GET SUBTYPES CONE');
    console.log(data);
    // this.environmentService.getSubtypesCone(d.uid);
    return data;
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
    // this.environmentService.insertModels(models);

    const payload = { facts, models };
    this.server.emit('system:addFacts', payload);
    // socketServer.emit("system", "addFacts", payload);
    // return payload;
    return payload;
  }

  @SubscribeMessage('user:loadEntity')
  userLoadEntity(@MessageBody() data: any): Promise<number> {
    console.log('LOAD ENTITY');
    console.log(data);
    // this.environmentService.loadEntity(d.uid);
    return data;
  }

  @SubscribeMessage('user:loadEntities')
  userLoadEntities(@MessageBody() data: any): Promise<number> {
    console.log('LOAD ENTITIES');
    console.log(data);
    // this.environmentService.loadEntities(d.uids);
    return data;
  }

  @SubscribeMessage('user:removeEntity')
  userRemoveEntity(@MessageBody() data: any): Promise<number> {
    console.log('REMOVE ENTITY');
    console.log(data);
    // this.environmentService.removeEntity(d.uid);
    return data;
  }

  @SubscribeMessage('user:removeEntities')
  userRemoveEntities(@MessageBody() data: any): Promise<number> {
    console.log('REMOVE ENTITIES');
    console.log(data);
    // this.environmentService.removeEntities(d.uids);
    return data;
  }

  @SubscribeMessage('user:clearEntities')
  userClearEntities(): Promise<number> {
    console.log('CLEAR ENTITIES');
    // this.environmentService.clearEntities();
    return null;
  }

  @SubscribeMessage('user:deleteEntity')
  userDeleteEntity(@MessageBody() data: any): Promise<number> {
    console.log('DELETE ENTITY');
    console.log(data);
    // const result = await deleteEntity(d.uid);
    // //if result is success
    // console.log("DELETE ENTITY RESULT", result);
    // removeEntity(d.uid);
    // console.log("Entity deleted");
    return data;
  }

  @SubscribeMessage('user:removeFact')
  userRemoveFact(@MessageBody() data: any): Promise<number> {
    console.log('REMOVE FACT');
    console.log(data);
    // removeFact(d.uid);
    return data;
  }

  @SubscribeMessage('user:deleteFact')
  userDeleteFact(@MessageBody() data: any): Promise<number> {
    console.log('DELETE FACT');
    console.log(data);

    // const result = await deleteFact(d.uid);
    // //if result is success
    // console.log("DELETE FACT RESULT", result);
    // removeFact(d.uid);
    // console.log("Fact deleted");
    return data;
  }

  @SubscribeMessage('user:removeEntitySubtypesRecursive')
  userRemoveEntitySubtypesRecursive(@MessageBody() data: any): Promise<number> {
    console.log('REMOVE ENTITY SUBTYPES RECURSIVE');
    console.log(data);
    // removeEntityDescendants(d.uid);
    return data;
  }

  @SubscribeMessage('user:getAllRelatedFacts')
  userGetAllRelatedFacts(@MessageBody() data: any): Promise<number> {
    console.log('GET ALL RELATED FACTS');
    console.log(data);
    // getAllRelatedFacts(d.uid);
    return data;
  }
}
