import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EnvironmentService } from '../environment/environment.service';
import { ArchivistWebSocketClientService } from '../services/archivist-websocket-client.service';
import { ApertureActions } from '@relica/websocket-contracts';
import customParser from 'socket.io-msgpack-parser';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
  // parser: customParser,
})
export class ApertureGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ApertureGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly archivistClient: ArchivistWebSocketClientService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('aperture.connection/established', {
      message: 'Connected to Aperture service',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Environment Operations
  @SubscribeMessage('get-environment')
  async getEnvironment(
    @MessageBody() payload: { userId: string; environmentId?: string },
  ) {
    try {
      const { userId, environmentId } = payload;
      let environment;

      if (environmentId) {
        environment = await this.environmentService.findOne(environmentId, userId);
      } else {
        environment = await this.environmentService.findDefaultForUser(userId);
      }

      // return {
      //   success: true,
      //   payload: environment,
      // };
      return environment

    } catch (error) {
      this.logger.error('Failed to get environment', error);
      return {
        success: false,
        error: {
          code: 'environment-get-failed',
          type: 'database-error',
          message: error.message,
        },
      };
    }
  }

  @SubscribeMessage('aperture.environment/list')
  async listEnvironments(@MessageBody() payload: { userId: string }) {
    try {
      const { userId } = payload;
      const environments = await this.environmentService.findAll(userId);

      return {
        success: true,
        data: environments,
      };
    } catch (error) {
      this.logger.error('Failed to list environments', error);
      return {
        success: false,
        error: {
          code: 'environment-list-failed',
          type: 'database-error',
          message: error.message,
        },
      };
    }
  }

  // @SubscribeMessage(ApertureActions.SPECIALIZATION_LOAD)
  // async loadSpecializationHierarchy(
  //   @MessageBody() payload: { uid: number; 'user-id': number; 'environment-id'?: number }
  // ) {
  //   try {
  //     this.logger.log(`Loading specialization hierarchy for UID: ${payload.uid}, User: ${payload['user-id']}`);

  //     const result = await this.environmentService.loadSpecializationHierarchy(
  //       payload['user-id'],
  //       payload.uid,
  //       payload['environment-id']
  //     );

  //     if (!result.success) {
  //       return {
  //         success: false,
  //         error: result.error || 'Failed to load specialization hierarchy',
  //       };
  //     }

  //     return {
  //       success: true,
  //       data: {
  //         facts: result.facts,
  //         environment: result.environment,
  //       },
  //     };
  //   } catch (error) {
  //     this.logger.error('Failed to load specialization hierarchy', error);
  //     return {
  //       success: false,
  //       error: {
  //         code: 'specialization-load-failed',
  //         type: 'database-error',
  //         message: error.message,
  //       },
  //     };
  //   }
  // }

  @SubscribeMessage('aperture.environment/create')
  async createEnvironment(
    @MessageBody() payload: { userId: string; name: string },
  ) {
    try {
      const { userId, name } = payload;
      const environment = await this.environmentService.create({ userId, name });

      return {
        success: true,
        data: environment,
      };
    } catch (error) {
      this.logger.error('Failed to create environment', error);
      return {
        success: false,
        error: {
          code: 'environment-create-failed',
          type: 'database-error',
          message: error.message,
        },
      };
    }
  }

  // Entity Operations
  @SubscribeMessage('aperture.entity/select')
  async selectEntity(
    @MessageBody() payload: { userId: string; environmentId: string; entityUid: string },
  ) {
    try {
      const { userId, environmentId, entityUid } = payload;
      const environment = await this.environmentService.selectEntity(
        environmentId,
        userId,
        entityUid,
      );

      // Broadcast to all clients
      this.server.emit('aperture.entity/selected', {
        entityUid,
        userId,
        environmentId,
      });

      return {
        success: true,
        data: {
          success: true,
          selectedEntity: entityUid,
        },
      };
    } catch (error) {
      this.logger.error('Failed to select entity', error);
      return {
        success: false,
        error: {
          code: 'entity-select-failed',
          type: 'database-error',
          message: error.message,
        },
      };
    }
  }

  @SubscribeMessage('aperture.entity/deselect')
  async deselectEntity(
    @MessageBody() payload: { userId: string; environmentId: string },
  ) {
    try {
      const { userId, environmentId } = payload;
      await this.environmentService.deselectEntity(environmentId, userId);

      // Broadcast to all clients
      this.server.emit('aperture.entity/deselected', {
        userId,
        environmentId,
      });

      return {
        success: true,
        data: {
          success: true,
        },
      };
    } catch (error) {
      this.logger.error('Failed to deselect entity', error);
      return {
        success: false,
        error: {
          code: 'entity-deselect-failed',
          type: 'database-error',
          message: error.message,
        },
      };
    }
  }

  @SubscribeMessage('aperture.environment/clear')
  async clearEnvironment(
    @MessageBody() payload: { userId: string; environmentId: string },
  ) {
    try {
      const { userId, environmentId } = payload;
      const environment = await this.environmentService.findOne(environmentId, userId);
      const factUids = environment.facts.map((fact) => fact.fact_uid);
      
      await this.environmentService.clearFacts(environmentId, userId);

      // Broadcast to all clients
      this.server.emit('aperture.facts/unloaded', {
        factUids,
        modelUids: [],
        userId,
        environmentId,
      });

      return {
        success: true,
        data: {
          success: true,
        },
      };
    } catch (error) {
      this.logger.error('Failed to clear environment', error);
      return {
        success: false,
        error: {
          code: 'environment-clear-failed',
          type: 'database-error',
          message: error.message,
        },
      };
    }
  }

  // Heartbeat
  @SubscribeMessage('relica.app/heartbeat')
  async heartbeat(@MessageBody() payload: { timestamp: number }) {
    return {
      success: true,
      data: {
        timestamp: Date.now(),
      },
    };
  }

  // Helper method to broadcast facts loaded
  broadcastFactsLoaded(
    facts: any[],
    userId: string,
    environmentId: string,
  ) {
    this.server.emit('aperture.facts/loaded', {
      facts,
      userId,
      environmentId,
    });
  }

  // Helper method to broadcast facts unloaded
  broadcastFactsUnloaded(
    factUids: string[],
    modelUids: string[],
    userId: string,
    environmentId: string,
  ) {
    this.server.emit('aperture.facts/unloaded', {
      factUids,
      modelUids,
      userId,
      environmentId,
    });
  }

  // Search Operations
  @SubscribeMessage(ApertureActions.SEARCH_LOAD_TEXT)
  async searchLoadText(
    @MessageBody() payload: { 'user-id': number; term: string },
  ) {
    try {
      const { 'user-id': userId, term } = payload;
      
      // Get text search results from Archivist
      const searchResult = await this.archivistClient.textSearch({
        searchTerm: term,
        exactMatch: true,
      });

      if (!searchResult.success) {
        return {
          success: false,
          error: searchResult.error || 'Text search failed',
        };
      }

      // Get or create default environment
      const environment = await this.environmentService.findDefaultForUser(userId.toString());
      
      // Filter facts to load (those matching the search term)
      const facts = searchResult.results?.facts || [];
      const factsToLoad = facts.filter((fact: any) => fact.lh_object_name === term);
      
      // Add facts to environment
      let updatedEnvironment = environment;
      if (factsToLoad.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          factsToLoad,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(factsToLoad, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: factsToLoad,
      };
    } catch (error) {
      this.logger.error('Failed to load text search results', error);
      return {
        success: false,
        error: 'Failed to load text search results',
      };
    }
  }

  @SubscribeMessage(ApertureActions.SEARCH_LOAD_UID)
  async searchLoadUid(
    @MessageBody() payload: { 'user-id': number; uid: number },
  ) {
    try {
      const { 'user-id': userId, uid } = payload;
      
      // Get UID search results from Archivist
      const searchResult = await this.archivistClient.uidSearch({
        searchUID: uid,
      });

      if (!searchResult.success) {
        return {
          success: false,
          error: searchResult.error || 'UID search failed',
        };
      }

      // Get or create default environment
      const environment = await this.environmentService.findDefaultForUser(userId.toString());
      
      // Filter facts to load (those matching the UID)
      const facts = searchResult.results?.facts || [];
      const factsToLoad = facts.filter((fact: any) => fact.lh_object_uid === uid);
      
      // Add facts to environment
      let updatedEnvironment = environment;
      if (factsToLoad.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          factsToLoad,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(factsToLoad, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: factsToLoad,
      };
    } catch (error) {
      this.logger.error('Failed to load UID search results', error);
      return {
        success: false,
        error: 'Failed to load UID search results',
      };
    }
  }

  // Specialization Operations
  @SubscribeMessage(ApertureActions.SPECIALIZATION_LOAD_FACT)
  async specializationLoadFact(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; uid: number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, uid } = payload;
      
      // Get specialization fact from Archivist
      const result = await this.archivistClient.getSpecializationFact(userId, uid);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get specialization fact',
        };
      }

      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());
      
      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: facts,
      };
    } catch (error) {
      this.logger.error('Failed to load specialization fact', error);
      return {
        success: false,
        error: 'Failed to load specialization fact',
      };
    }
  }

  @SubscribeMessage(ApertureActions.SPECIALIZATION_LOAD)
  async specializationLoad(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; uid: number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, uid } = payload;

      // Get specialization hierarchy from Archivist
      const result = await this.archivistClient.getSpecializationHierarchy(userId, uid);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get specialization hierarchy',
        };
      }

      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());
      
      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: facts,
      };
    } catch (error) {
      this.logger.error('Failed to load specialization hierarchy', error);
      return {
        success: false,
        error: 'Failed to load specialization hierarchy',
      };
    }
  }

  // Entity Operations
  @SubscribeMessage(ApertureActions.ENTITY_LOAD)
  async entityLoad(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uid': number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uid': entityUid } = payload;
      
      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Get definitive facts for the entity
      const defResult = await this.archivistClient.getDefinitiveFacts(entityUid);
      const definitiveFacts = defResult.facts || [];

      // If there's a selected entity, get facts relating it to our entity
      let relatingFacts = [];
      if (environment.selectedEntityId) {
        const relResult = await this.archivistClient.getFactsRelatingEntities(
          entityUid,
          parseInt(environment.selectedEntityId),
        );
        relatingFacts = relResult.facts || [];
      }

      // Combine all new facts
      const allNewFacts = [...definitiveFacts, ...relatingFacts];
      
      // Add facts to environment
      let updatedEnvironment = environment;
      if (allNewFacts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          allNewFacts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(allNewFacts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: allNewFacts,
      };
    } catch (error) {
      this.logger.error('Failed to load entity', error);
      return {
        success: false,
        error: 'Failed to load entity',
      };
    }
  }

  @SubscribeMessage(ApertureActions.ENTITY_UNLOAD)
  async entityUnload(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uid': number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uid': entityUid } = payload;
      
      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Find facts to remove (those where the entity is on either side)
      const factsToRemove = environment.facts.filter((fact: any) => 
        fact.lh_object_uid === entityUid || fact.rh_object_uid === entityUid
      );

      const factUidsToRemove = factsToRemove.map((fact: any) => fact.fact_uid);

      // Remove facts from environment
      const updatedEnvironment = await this.environmentService.removeFacts(
        environment.id,
        userId.toString(),
        factUidsToRemove,
      );

      // Find candidate model UIDs to remove (entities referenced in removed facts)
      const candidateModelUids = new Set<number>();
      factsToRemove.forEach((fact: any) => {
        candidateModelUids.add(fact.lh_object_uid);
        candidateModelUids.add(fact.rh_object_uid);
      });

      // Remove models from candidates if they're still referenced in remaining facts
      const remainingFacts = updatedEnvironment.facts;
      const finalModelUidsToRemove = Array.from(candidateModelUids).filter(modelUid => {
        return !remainingFacts.some((fact: any) => 
          fact.lh_object_uid === modelUid || fact.rh_object_uid === modelUid
        );
      });

      // Broadcast facts unloaded event
      this.broadcastFactsUnloaded(
        factUidsToRemove.map(String),
        finalModelUidsToRemove.map(String),
        userId.toString(), 
        environment.id
      );

      return {
        success: true,
        environment: updatedEnvironment,
        'fact-uids-removed': factUidsToRemove,
        'model-uids-removed': finalModelUidsToRemove,
      };
    } catch (error) {
      this.logger.error('Failed to unload entity', error);
      return {
        success: false,
        error: 'Failed to unload entity',
      };
    }
  }

  @SubscribeMessage(ApertureActions.ENTITY_LOAD_MULTIPLE)
  async entityLoadMultiple(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uids': number[] },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uids': entityUids } = payload;
      
      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Load each entity and collect all facts
      const allNewFacts = [];
      for (const entityUid of entityUids) {
        const result = await this.entityLoad({
          'user-id': userId,
          'environment-id': envId,
          'entity-uid': entityUid,
        });
        
        if (result.success && result.facts) {
          allNewFacts.push(...result.facts);
        }
      }

      // Deduplicate facts by fact_uid
      const uniqueFacts = Array.from(
        new Map(allNewFacts.map(fact => [fact.fact_uid, fact])).values()
      );

      // Get updated environment
      const updatedEnvironment = await this.environmentService.findOne(
        environment.id,
        userId.toString()
      );

      return {
        success: true,
        environment: updatedEnvironment,
        facts: uniqueFacts,
      };
    } catch (error) {
      this.logger.error('Failed to load entities', error);
      return {
        success: false,
        error: 'Failed to load entities',
      };
    }
  }

  @SubscribeMessage(ApertureActions.ENTITY_UNLOAD_MULTIPLE)
  async entityUnloadMultiple(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uids': number[] },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uids': entityUids } = payload;
      
      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Find all facts to remove (those where any entity is on either side)
      const factsToRemove = environment.facts.filter((fact: any) =>
        entityUids.includes(fact.lh_object_uid) || entityUids.includes(fact.rh_object_uid)
      );

      const factUidsToRemove = factsToRemove.map((fact: any) => fact.fact_uid);

      // Remove facts from environment
      const updatedEnvironment = await this.environmentService.removeFacts(
        environment.id,
        userId.toString(),
        factUidsToRemove,
      );

      // Find candidate model UIDs to remove
      const candidateModelUids = new Set<number>();
      factsToRemove.forEach((fact: any) => {
        candidateModelUids.add(fact.lh_object_uid);
        candidateModelUids.add(fact.rh_object_uid);
      });

      // Remove models from candidates if they're still referenced in remaining facts
      const remainingFacts = updatedEnvironment.facts;
      const finalModelUidsToRemove = Array.from(candidateModelUids).filter(modelUid => {
        return !remainingFacts.some((fact: any) => 
          fact.lh_object_uid === modelUid || fact.rh_object_uid === modelUid
        );
      });

      // Broadcast facts unloaded event
      this.broadcastFactsUnloaded(
        factUidsToRemove.map(String),
        finalModelUidsToRemove.map(String),
        userId.toString(), 
        environment.id
      );

      return {
        success: true,
        environment: updatedEnvironment,
        'fact-uids-removed': factUidsToRemove,
        'model-uids-removed': finalModelUidsToRemove,
      };
    } catch (error) {
      this.logger.error('Failed to unload entities', error);
      return {
        success: false,
        error: 'Failed to unload entities',
      };
    }
  }

  // Subtype Operations
  @SubscribeMessage(ApertureActions.SUBTYPE_LOAD)
  async subtypeLoad(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uid': number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uid': entityUid } = payload;
      
      // Get subtypes from Archivist
      const result = await this.archivistClient.getSubtypes(entityUid);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get subtypes',
        };
      }

      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());
      
      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: facts,
      };
    } catch (error) {
      this.logger.error('Failed to load subtypes', error);
      return {
        success: false,
        error: 'Failed to load subtypes',
      };
    }
  }

  @SubscribeMessage(ApertureActions.SUBTYPE_LOAD_CONE)
  async subtypeLoadCone(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uid': number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uid': entityUid } = payload;
      
      // Get subtypes cone from Archivist
      const result = await this.archivistClient.getSubtypesCone(entityUid);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get subtypes cone',
        };
      }

      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());
      
      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: facts,
      };
    } catch (error) {
      this.logger.error('Failed to load subtypes cone', error);
      return {
        success: false,
        error: 'Failed to load subtypes cone',
      };
    }
  }

  @SubscribeMessage(ApertureActions.SUBTYPE_UNLOAD_CONE)
  async subtypeUnloadCone(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uid': number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uid': entityUid } = payload;
      
      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());

      // This is a complex operation that requires recursive removal of subtype hierarchies
      // For now, we'll implement a simplified version that removes facts where the entity is the RH (parent)
      const factsToRemove = environment.facts.filter((fact: any) => 
        fact.rh_object_uid === entityUid && fact.rel_type_uid === 1146 // 1146 is subtyping relation
      );

      const factUidsToRemove = factsToRemove.map((fact: any) => fact.fact_uid);

      // Remove facts from environment
      const updatedEnvironment = await this.environmentService.removeFacts(
        environment.id,
        userId.toString(),
        factUidsToRemove,
      );

      // Find candidate model UIDs to remove
      const candidateModelUids = new Set<number>();
      factsToRemove.forEach((fact: any) => {
        candidateModelUids.add(fact.lh_object_uid);
        candidateModelUids.add(fact.rh_object_uid);
      });

      // Remove models from candidates if they're still referenced in remaining facts
      const remainingFacts = updatedEnvironment.facts;
      const finalModelUidsToRemove = Array.from(candidateModelUids).filter(modelUid => {
        return !remainingFacts.some((fact: any) => 
          fact.lh_object_uid === modelUid || fact.rh_object_uid === modelUid
        );
      });

      // Broadcast facts unloaded event
      this.broadcastFactsUnloaded(
        factUidsToRemove.map(String),
        finalModelUidsToRemove.map(String),
        userId.toString(), 
        environment.id
      );

      return {
        success: true,
        environment: updatedEnvironment,
        'fact-uids-removed': factUidsToRemove,
        'model-uids-removed': finalModelUidsToRemove,
      };
    } catch (error) {
      this.logger.error('Failed to unload subtypes cone', error);
      return {
        success: false,
        error: 'Failed to unload subtypes cone',
      };
    }
  }

  // Classification Operations
  @SubscribeMessage(ApertureActions.CLASSIFICATION_LOAD)
  async classificationLoad(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uid': number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uid': entityUid } = payload;
      
      // Get classified entities from Archivist
      const result = await this.archivistClient.getClassified(entityUid);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get classified entities',
        };
      }

      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());
      
      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: facts,
      };
    } catch (error) {
      this.logger.error('Failed to load classified entities', error);
      return {
        success: false,
        error: 'Failed to load classified entities',
      };
    }
  }

  @SubscribeMessage(ApertureActions.CLASSIFICATION_LOAD_FACT)
  async classificationLoadFact(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uid': number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uid': entityUid } = payload;
      
      // Get classification fact from Archivist
      const result = await this.archivistClient.getClassificationFact(entityUid);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get classification fact',
        };
      }

      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());
      
      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: facts,
      };
    } catch (error) {
      this.logger.error('Failed to load classification fact', error);
      return {
        success: false,
        error: 'Failed to load classification fact',
      };
    }
  }

  // Composition Operations
  @SubscribeMessage(ApertureActions.COMPOSITION_LOAD)
  async compositionLoad(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uid': number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uid': entityUid } = payload;
      
      // Get composition relationships from Archivist (1190 is composition relation type)
      const result = await this.archivistClient.getRecursiveRelations(entityUid, 1190);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get composition relationships',
        };
      }

      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());
      
      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: facts,
      };
    } catch (error) {
      this.logger.error('Failed to load composition relationships', error);
      return {
        success: false,
        error: 'Failed to load composition relationships',
      };
    }
  }

  @SubscribeMessage(ApertureActions.COMPOSITION_LOAD_IN)
  async compositionLoadIn(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uid': number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uid': entityUid } = payload;
      
      // Get incoming composition relationships from Archivist (1190 is composition relation type)
      const result = await this.archivistClient.getRecursiveRelationsTo(entityUid, 1190);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get incoming composition relationships',
        };
      }

      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());
      
      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: facts,
      };
    } catch (error) {
      this.logger.error('Failed to load incoming composition relationships', error);
      return {
        success: false,
        error: 'Failed to load incoming composition relationships',
      };
    }
  }

  // Connection Operations
  @SubscribeMessage(ApertureActions.CONNECTION_LOAD)
  async connectionLoad(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uid': number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uid': entityUid } = payload;
      
      // Get connection relationships from Archivist (1487 is connection relation type)
      const result = await this.archivistClient.getRecursiveRelations(entityUid, 1487);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get connection relationships',
        };
      }

      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());
      
      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: facts,
      };
    } catch (error) {
      this.logger.error('Failed to load connection relationships', error);
      return {
        success: false,
        error: 'Failed to load connection relationships',
      };
    }
  }

  @SubscribeMessage(ApertureActions.CONNECTION_LOAD_IN)
  async connectionLoadIn(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; 'entity-uid': number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, 'entity-uid': entityUid } = payload;
      
      // Get incoming connection relationships from Archivist (1487 is connection relation type)
      const result = await this.archivistClient.getRecursiveRelationsTo(entityUid, 1487);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get incoming connection relationships',
        };
      }

      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());
      
      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: facts,
      };
    } catch (error) {
      this.logger.error('Failed to load incoming connection relationships', error);
      return {
        success: false,
        error: 'Failed to load incoming connection relationships',
      };
    }
  }

  // Relation Operations
  @SubscribeMessage(ApertureActions.RELATION_REQUIRED_ROLES_LOAD)
  async relationRequiredRolesLoad(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; uid: number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, uid } = payload;
      
      // Get required roles from Archivist
      const result = await this.archivistClient.getRequiredRoles(uid);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get required roles',
        };
      }

      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());
      
      // Add facts to environment
      const facts = result.data || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: facts,
      };
    } catch (error) {
      this.logger.error('Failed to load required roles', error);
      return {
        success: false,
        error: 'Failed to load required roles',
      };
    }
  }

  @SubscribeMessage(ApertureActions.RELATION_ROLE_PLAYERS_LOAD)
  async relationRolePlayersLoad(
    @MessageBody() payload: { 'user-id': number; 'environment-id'?: number; uid: number },
  ) {
    try {
      const { 'user-id': userId, 'environment-id': envId, uid } = payload;
      
      // Get role players from Archivist
      const result = await this.archivistClient.getRolePlayers(uid);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get role players',
        };
      }

      // Get environment
      const environment = envId 
        ? await this.environmentService.findOne(envId.toString(), userId.toString())
        : await this.environmentService.findDefaultForUser(userId.toString());
      
      // Extract facts from the role player data structure (based on Clojure implementation)
      const data = result.data || [];
      const facts = [];
      
      for (const roleData of data) {
        if (roleData.requirement) facts.push(roleData.requirement);
        if (roleData.player) facts.push(roleData.player);
      }
      
      // Add facts to environment
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts,
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return {
        success: true,
        environment: updatedEnvironment,
        facts: facts,
      };
    } catch (error) {
      this.logger.error('Failed to load role players', error);
      return {
        success: false,
        error: 'Failed to load role players',
      };
    }
  }
}
