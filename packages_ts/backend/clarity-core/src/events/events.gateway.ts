import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
  ConnectedSocket,
} from '@nestjs/websockets';
// import { from, Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import { EnvironmentService } from '../environment/environment.service.js';
import { ArchivistService } from '../archivist/archivist.service.js';
import { Logger } from '@nestjs/common';
import { Fact } from '@relica/types';
import { REPLService } from '../repl/repl.service.js';

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

const decodeToken = (token: string) => {
  const [_header, payload, _signature] = token.split('.');
  return JSON.parse(Buffer.from(payload, 'base64url').toString());
};

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
    delete client.data.token;
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

  // LOGIN/OUT //
  @SubscribeMessage('user:login')
  async userLogin(
    @MessageBody('token') token: string,
    @ConnectedSocket() client: Socket,
  ) {
    const decoded = decodeToken(token);
    const userID = decoded.sub;

    this.logger.log('USER LOGIN !!!!!!!!!!!!!!', token);
    console.log('USER WHO IS LOGGED IN: ', userID);

    // const env = await this.environmentService.getUserEnvironment(userId);

    // client.data.environment = env;
    client.data.userId = userID;
    client.data.token = token;

    // const r = await this.repl.getUserRepl(userID, token);

    // console.log('USER REPL CREATED');
    // console.log(r);

    // const x = await this.repl.saveUserState(userID, r);
  }

  // NOUS //

  // @SubscribeMessage('nous:selectEntity')
  // async nouseSelectEntity(@MessageBody('uid') uid: number): Promise<number> {
  //   console.log('NOUS:SELECT ENTITY', uid);

  //   const result = await new Promise<any>((resolve, reject) => {
  //     this.repl.exec(`(selectEntity ${uid})`, resolve);
  //   });
  //   // this.server.emit('system:selectEntity', { uid: uid });

  //   return result;
  // }

  // @SubscribeMessage('nous:loadEntity')
  // async nouseLoadEntity(@MessageBody('uid') uid: number): Promise<any> {
  //   console.log('NOUS:LOAD ENTITY', uid);
  //   const result = await new Promise<any>((resolve, reject) => {
  //     this.repl.exec(`(loadEntity ${uid})`, resolve);
  //   });
  //   return result;
  // }

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
  // @SubscribeMessage('repl:eval')
  // async replEval(@MessageBody('command') command: string): Promise<string> {
  //   this.logger.log('REPL:EVAL');
  //   this.logger.log(command);

  //   const result = await new Promise<any>((resolve, reject) => {
  //     this.repl.exec(command, resolve);
  //   });

  //   console.log('REPL:EVAL RESULT', result);
  //   return result;
  // }

  // // LEGACY //

  @SubscribeMessage('user:selectEntity')
  async userSelectEntity(@MessageBody('uid') uid: number): Promise<number> {
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(selectEntity ${uid})`, resolve);
    });

    return result;
  }

  // @SubscribeMessage('user:selectFact')
  // async userSelectFact(@MessageBody('uid') uid: any): Promise<number> {
  //   const result = await new Promise<any>((resolve, reject) => {
  //     this.repl.exec(`(selectFact ${uid})`, resolve);
  //   });

  //   return result;
  // }

  // @SubscribeMessage('user:selectNone')
  // async userSelectNone(): Promise<number> {
  //   const result = await new Promise<any>((resolve, reject) => {
  //     this.repl.exec(`(selectNone)`, resolve);
  //   });

  //   return result;
  // }

  // @SubscribeMessage('user:loadSubtypesCone')
  // async userGetSubtypesCone(@MessageBody('uid') uid: any): Promise<number> {
  //   const result = await new Promise<any>((resolve, reject) => {
  //     this.repl.exec(`(loadSubtypesCone ${uid})`, resolve);
  //   });

  //   return result;
  // }

  @SubscribeMessage('user:loadSpecializationHierarchy')
  async userLoadSpecializationHierarchy(
    @MessageBody('uid') uid: number,
    @MessageBody('token') token: string,
  ): Promise<any> {
    const decoded = decodeToken(token);
    const userID = decoded.sub;

    const res = await this.archivistService.getSpecializationHierarchy(
      uid,
      token,
    );
    const facts = res.facts;
    const models = res.models;

    console.log('USER WHO IS LOGGED IN: ', userID);

    await this.environmentService.insertFacts(facts, userID);
    await this.environmentService.insertModels(models); //, userID);

    // const result = await new Promise<any>((resolve, reject) => {
    //   this.repl.exec(`(loadSpecializationHierarchy ${uid})`, resolve);
    // });

    // return result;

    return {
      facts,
      models,
    };
  }

  // @SubscribeMessage('user:loadEntity')
  // async userLoadEntity(@MessageBody('uid') uid: number): Promise<number> {
  //   const result = await new Promise<any>((resolve, reject) => {
  //     this.repl.exec(`(loadEntity ${uid})`, resolve);
  //   });
  //   return result;
  // }

  // @SubscribeMessage('user:loadEntities')
  // async userLoadEntities(@MessageBody('uids') uids: number[]): Promise<any> {
  //   const loadUidsStr = uids.join(' ');
  //   const result = await new Promise<any>((resolve, reject) => {
  //     this.repl.exec(`(loadEntities [${loadUidsStr}])`, resolve);
  //   });
  //   return result;
  // }

  // @SubscribeMessage('user:unloadEntity')
  // async userUnloadEntity(@MessageBody('uid') uid: number): Promise<number> {
  //   const result = await new Promise<any>((resolve, reject) => {
  //     this.repl.exec(`(unloadEntity ${uid})`, resolve);
  //   });
  //   return result;
  // }

  // @SubscribeMessage('user:unloadEntities')
  // async userUnloadEntities(
  //   @MessageBody('uids') uids: number[],
  // ): Promise<number[]> {
  //   const loadUidsStr = uids.join(' ');
  //   const result = await new Promise<any>((resolve, reject) => {
  //     this.repl.exec(`(unloadEntities [${loadUidsStr}])`, resolve);
  //   });
  //   return result;
  // }

  @SubscribeMessage('user:clearEntities')
  async userClearEntities(): Promise<void> {
    const result = await new Promise<any>((resolve, reject) => {
      this.repl.exec(`(clearEntities)`, resolve);
    });
    return;
  }

  // @SubscribeMessage('user:deleteEntity')
  // async userDeleteEntity(@MessageBody('uid') uid: number): Promise<number> {
  //   console.log('DELETE ENTITY');
  //   console.log(uid);
  //   const result = await this.archivistService.deleteEntity(uid);
  //   // if result is success
  //   console.log('DELETE ENTITY RESULT', result);
  //   const removedFactUids = await this.environmentService.unloadEntity(uid);
  //   // console.log("Entity deleted");

  //   this.server.emit('system:remFacts', { fact_uids: removedFactUids });
  //   return uid;
  // }

  // @SubscribeMessage('user:deleteFact')
  // async userDeleteFact(@MessageBody('uid') uid: number): Promise<number> {
  //   console.log('DELETE FACT');
  //   console.log(uid);

  //   const result = await this.archivistService.deleteFact(uid);
  //   //if result is success
  //   console.log('DELETE FACT RESULT', result);
  //   this.environmentService.removeFact(uid);
  //   // console.log("Fact deleted");

  //   this.server.emit('system:remFacts', { fact_uids: [uid] });
  //   return uid;
  // }

  // // @SubscribeMessage('user:unloadSubtypesCone')
  // // async userRemoveEntitySubtypesRecursive(
  // //   @MessageBody('uid') uid: number,
  // // ): Promise<number> {
  // //   console.log('REMOVE ENTITY SUBTYPES RECURSIVE');
  // //   console.log(uid);
  // //   console.log('>// REMOVE ENTITY DESCENDANTS');
  // //   const env = await this.environmentService.retrieveEnvironment();
  // //   const facts = env.facts;
  // //   let factsToRemove: Fact[] = [];
  // //   let remainingFacts: Fact[] = [];
  // //   facts.forEach((fact: Fact) => {
  // //     if (/* fact.lh_object_uid === uid || */ fact.rh_object_uid === uid) {
  // //       factsToRemove.push(fact);
  // //     } else {
  // //       remainingFacts.push(fact);
  // //     }
  // //   });
  // //   let factUIDsToRemove: number[] = [];
  // //   let candidateModelUIDsToRemove: Set<number> = new Set();
  // //   factsToRemove.forEach((fact: Fact) => {
  // //     factUIDsToRemove.push(fact.fact_uid);
  // //     candidateModelUIDsToRemove.add(fact.lh_object_uid);
  // //     candidateModelUIDsToRemove.add(fact.rh_object_uid);
  // //   });
  // //   remainingFacts.forEach((fact: Fact) => {
  // //     if (candidateModelUIDsToRemove.has(fact.lh_object_uid)) {
  // //       candidateModelUIDsToRemove.delete(fact.lh_object_uid);
  // //     }
  // //     if (candidateModelUIDsToRemove.has(fact.rh_object_uid)) {
  // //       candidateModelUIDsToRemove.delete(fact.rh_object_uid);
  // //     }
  // //   });
  // //   this.environmentService.removeFacts(factUIDsToRemove);
  // //   // TODO: i don't think all the models needing to be removed are being removed
  // //   this.environmentService.removeModels(
  // //     Array.from(candidateModelUIDsToRemove),
  // //   );
  // //   // this.server.emit('system:unloadedFacts', { fact_uids: factUIDsToRemove });
  // //   const subtypingFacts = factsToRemove.filter(
  // //     (fact: Fact) => fact.rel_type_uid === 1146 && fact.rh_object_uid === uid,
  // //   );
  // //   console.log('SUBTYPING FACTS: ', subtypingFacts);
  // //   subtypingFacts.forEach((fact: Fact) => {
  // //     console.log('>>> RECURSE ON: ', fact.lh_object_uid);
  // //     this.userRemoveEntitySubtypesRecursive(fact.lh_object_uid);
  // //   });

  // //   return uid;
  // // }

  // @SubscribeMessage('user:unloadSubtypesCone')
  // async userRemoveEntitySubtypesRecursive(
  //   @MessageBody('uid') uid: number,
  // ): Promise<number> {
  //   console.log('REMOVE ENTITY SUBTYPES RECURSIVE');
  //   console.log('UID:', uid);
  //   console.log('>// REMOVE ENTITY DESCENDANTS');

  //   try {
  //     const env = await this.environmentService.retrieveEnvironment();
  //     const facts = env.facts;
  //     let factsToRemove: Fact[] = [];
  //     let remainingFacts: Fact[] = [];

  //     facts.forEach((fact: Fact) => {
  //       if (/*fact.lh_object_uid === uid ||*/ fact.rh_object_uid === uid) {
  //         factsToRemove.push(fact);
  //       } else {
  //         remainingFacts.push(fact);
  //       }
  //     });

  //     console.log('Facts to remove:', factsToRemove.length);
  //     console.log('Remaining facts:', remainingFacts.length);

  //     let factUIDsToRemove: number[] = [];
  //     let lhModelUIDsToRemove: Set<number> = new Set();
  //     let rhModelUIDsToRemove: Set<number> = new Set();

  //     factsToRemove.forEach((fact: Fact) => {
  //       factUIDsToRemove.push(fact.fact_uid);
  //       lhModelUIDsToRemove.add(fact.lh_object_uid);
  //       rhModelUIDsToRemove.add(fact.rh_object_uid);
  //     });

  //     remainingFacts.forEach((fact: Fact) => {
  //       lhModelUIDsToRemove.delete(fact.lh_object_uid);
  //       lhModelUIDsToRemove.delete(fact.rh_object_uid);
  //       rhModelUIDsToRemove.delete(fact.lh_object_uid);
  //       rhModelUIDsToRemove.delete(fact.rh_object_uid);
  //     });

  //     const modelsToRemove = new Set([
  //       ...lhModelUIDsToRemove,
  //       ...rhModelUIDsToRemove,
  //     ]);
  //     console.log('Models to remove:', modelsToRemove.size);

  //     await this.environmentService.removeFacts(factUIDsToRemove);
  //     await this.environmentService.removeModels(Array.from(modelsToRemove));

  //     // Uncomment if needed:
  //     // this.server.emit('system:unloadedFacts', { fact_uids: factUIDsToRemove });

  //     const subtypingFacts = factsToRemove.filter(
  //       (fact: Fact) =>
  //         fact.rel_type_uid === 1146 && fact.rh_object_uid === uid,
  //     );
  //     console.log('SUBTYPING FACTS: ', subtypingFacts.length);

  //     await Promise.all(
  //       subtypingFacts.map(async (fact: Fact) => {
  //         console.log('>>> RECURSE ON: ', fact.lh_object_uid);
  //         await this.userRemoveEntitySubtypesRecursive(fact.lh_object_uid);
  //       }),
  //     );

  //     return uid;
  //   } catch (error) {
  //     console.error('Error in userRemoveEntitySubtypesRecursive:', error);
  //     throw error;
  //   }
  // }

  // @SubscribeMessage('user:loadAllRelatedFacts')
  // async userGetAllRelatedFacts(@MessageBody('uid') uid: number): Promise<any> {
  //   const result = await new Promise<any>((resolve, reject) => {
  //     this.repl.exec(`(loadAllRelatedFacts ${uid})`, resolve);
  //   });
  //   return result;
  // }
}
