import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { EnvironmentService } from "../environment/environment.service";
import { ArchivistSocketClient } from "@relica/websocket-clients";
import { ApertureActions, ApertureEvents } from "@relica/websocket-contracts";
import customParser from "socket.io-msgpack-parser";
import { toResponse, toErrorResponse } from "@relica/websocket-contracts";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
  transports: ["websocket"],
  // parser: customParser,
})
export class ApertureGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ApertureGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly archivistClient: ArchivistSocketClient
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit("aperture.connection/established", {
      message: "Connected to Aperture service",
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Environment Operations
  @SubscribeMessage(ApertureActions.ENVIRONMENT_GET)
  async getEnvironment(@MessageBody() message: any) {
    try {
      const { userId, environmentId } = message.payload;
      let environment;

      if (environmentId) {
        environment = await this.environmentService.findOne(
          environmentId,
          userId
        );
      } else {
        environment = await this.environmentService.findDefaultForUser(userId);
      }

      return toResponse(environment, message.id);
    } catch (error) {
      this.logger.error("Failed to get environment", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.ENVIRONMENT_LIST)
  async listEnvironments(@MessageBody() message: any) {
    try {
      const { userId } = message.payload;
      const environments = await this.environmentService.findAll(userId);

      return toResponse(environments, message.id);
    } catch (error) {
      this.logger.error("Failed to list environments", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.ENVIRONMENT_CREATE)
  async createEnvironment(@MessageBody() message: any) {
    try {
      const { userId, name } = message.payload;
      const environment = await this.environmentService.create({
        userId,
        name,
      });

      return toResponse(environment, message.id);
    } catch (error) {
      this.logger.error("Failed to create environment", error);
      return toErrorResponse(error, message.id);
    }
  }

  // Entity Operations
  // @SubscribeMessage('aperture.entity/select')
  @SubscribeMessage(ApertureActions.SELECT_ENTITY)
  async selectEntity(@MessageBody() message: any) {
    try {
      const { userId, environmentId, uid } = message.payload;
      const environment = await this.environmentService.selectEntity(
        environmentId,
        userId,
        uid
      );

      // Broadcast to all clients
      this.server.emit(ApertureEvents.ENTITY_SELECTED, {
        uid,
        userId,
        environmentId,
      });

      return toResponse(
        {
          selectedEntity: uid,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to select entity", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.ENTITY_DESELECT)
  async deselectEntity(@MessageBody() message: any) {
    try {
      const { userId, environmentId } = message.payload;
      console.log(
        "Deselecting entity for user:",
        userId,
        "in environment:",
        environmentId
      );
      await this.environmentService.deselectEntity(environmentId, userId);

      // Broadcast to all clients
      this.server.emit(ApertureEvents.ENTITY_DESELECTED, {
        userId,
        environmentId,
      });

      return toResponse({}, message.id);
    } catch (error) {
      this.logger.error("Failed to deselect entity", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.ENVIRONMENT_CLEAR)
  async clearEnvironment(@MessageBody() message: any) {
    try {
      const { userId, environmentId } = message.payload;
      const environment = await this.environmentService.findOne(
        environmentId,
        userId
      );
      const factUids = environment.facts.map((fact) => fact.fact_uid);

      await this.environmentService.clearFacts(environmentId, userId);

      // Broadcast to all clients - matches FactsUnloadedEventSchema
      this.server.emit("aperture.facts/unloaded", {
        factUids,
        modelUids: [],
        userId: Number(userId),
        environmentId: Number(environmentId),
      });

      return toResponse({ factUids }, message.id);
    } catch (error) {
      this.logger.error("Failed to clear environment", error);
      return toErrorResponse(error, message.id);
    }
  }

  // Heartbeat
  @SubscribeMessage("relica.app/heartbeat")
  async heartbeat(@MessageBody() message: any) {
    return toResponse(
      {
        timestamp: Date.now(),
      },
      message.id
    );
  }

  // Helper method to broadcast facts loaded
  broadcastFactsLoaded(facts: any[], userId: string, environmentId: string) {
    this.server.emit(ApertureEvents.LOADED_FACTS, {
      facts,
      userId,
      environmentId,
    });
  }

  // Helper method to broadcast facts unloaded
  broadcastFactsUnloaded(
    factUids: number[],
    modelUids: number[],
    userId: number,
    environmentId: string
  ) {
    this.server.emit(ApertureEvents.UNLOADED_FACTS, {
      factUids,
      modelUids,
      userId,
      environmentId,
    });
  }

  // Search Operations
  @SubscribeMessage(ApertureActions.SEARCH_LOAD_TEXT)
  async searchLoadText(@MessageBody() message: any) {
    try {
      const { "user-id": userId, term } = message.payload;

      // Get text search results from Archivist
      const searchResult = await this.archivistClient.textSearch({
        searchTerm: term,
        exactMatch: true,
      });

      // Get or create default environment
      const environment = await this.environmentService.findDefaultForUser(
        userId.toString()
      );

      // Filter facts to load (those matching the search term)
      const facts = searchResult.results?.facts || [];
      const factsToLoad = facts.filter(
        (fact: any) => fact.lh_object_name === term
      );

      // Add facts to environment
      let updatedEnvironment = environment;
      if (factsToLoad.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          factsToLoad
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(factsToLoad, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: factsToLoad,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load text search results", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.SEARCH_LOAD_UID)
  async searchLoadUid(@MessageBody() message: any) {
    try {
      const { "user-id": userId, uid } = message.payload;

      // Get UID search results from Archivist
      const searchResult = await this.archivistClient.uidSearch({
        searchUID: uid,
      });

      // Get or create default environment
      const environment = await this.environmentService.findDefaultForUser(
        userId.toString()
      );

      // Filter facts to load (those matching the UID)
      const facts = searchResult.results?.facts || [];
      const factsToLoad = facts.filter(
        (fact: any) => fact.lh_object_uid === uid
      );

      // Add facts to environment
      let updatedEnvironment = environment;
      if (factsToLoad.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          factsToLoad
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(factsToLoad, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: factsToLoad,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load UID search results", error);
      return toErrorResponse(error, message.id);
    }
  }

  // Specialization Operations
  @SubscribeMessage(ApertureActions.SPECIALIZATION_LOAD_FACT)
  async specializationLoadFact(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        uid,
      } = message.payload;

      // Get specialization fact from Archivist
      const result = await this.archivistClient.getSpecializationFact(
        userId,
        uid
      );

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: facts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load specialization fact", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.SPECIALIZATION_LOAD)
  async specializationLoad(@MessageBody() message: any) {
    try {
      const { userId, environmentId, uid } = message.payload;

      // Get specialization hierarchy from Archivist
      const result = await this.archivistClient.getSpecializationHierarchy(
        userId,
        uid
      );

      // Get environment
      const environment = environmentId
        ? await this.environmentService.findOne(
            environmentId,
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: facts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load specialization hierarchy", error);
      return toErrorResponse(error, message.id);
    }
  }

  // Entity Operations
  @SubscribeMessage(ApertureActions.ENTITY_LOAD)
  async entityLoad(@MessageBody() message: any) {
    try {
      const { userId, environmentId, entityUid } = message.payload;

      // Get environment
      const environment = environmentId
        ? await this.environmentService.findOne(
            environmentId,
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Get definitive facts for the entity
      const defResult =
        await this.archivistClient.getDefinitiveFacts(entityUid);

      // If there's a selected entity, get facts relating it to our entity
      let relatingFacts = [];
      if (environment.selectedEntityId) {
        const relResult = await this.archivistClient.getFactsRelatingEntities(
          entityUid,
          parseInt(environment.selectedEntityId)
        );
        relatingFacts = relResult.facts || [];
      }

      // Combine all new facts
      const allNewFacts = [...defResult, ...relatingFacts];

      // Add facts to environment
      let updatedEnvironment = environment;
      if (allNewFacts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          allNewFacts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(allNewFacts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: allNewFacts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load entity", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.ENTITY_UNLOAD)
  async entityUnload(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        "entity-uid": entityUid,
      } = message.payload;

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Find facts to remove (those where the entity is on either side)
      const factsToRemove = environment.facts.filter(
        (fact: any) =>
          fact.lh_object_uid === entityUid || fact.rh_object_uid === entityUid
      );

      const factUidsToRemove = factsToRemove.map((fact: any) => fact.fact_uid);

      // Remove facts from environment
      const updatedEnvironment = await this.environmentService.removeFacts(
        environment.id,
        userId.toString(),
        factUidsToRemove
      );

      // Find candidate model UIDs to remove (entities referenced in removed facts)
      const candidateModelUids = new Set<number>();
      factsToRemove.forEach((fact: any) => {
        candidateModelUids.add(fact.lh_object_uid);
        candidateModelUids.add(fact.rh_object_uid);
      });

      // Remove models from candidates if they're still referenced in remaining facts
      const remainingFacts = updatedEnvironment.facts;
      const finalModelUidsToRemove = Array.from(candidateModelUids).filter(
        (modelUid) => {
          return !remainingFacts.some(
            (fact: any) =>
              fact.lh_object_uid === modelUid || fact.rh_object_uid === modelUid
          );
        }
      );

      // Broadcast facts unloaded event
      this.broadcastFactsUnloaded(
        factUidsToRemove,
        finalModelUidsToRemove,
        userId.toString(),
        environment.id
      );

      return toResponse(
        {
          environment: updatedEnvironment,
          "fact-uids-removed": factUidsToRemove,
          "model-uids-removed": finalModelUidsToRemove,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to unload entity", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.ENTITY_LOAD_MULTIPLE)
  async entityLoadMultiple(@MessageBody() message: any) {
    try {
      const { userId, environmentId, uids } = message.payload;

      // Get environment
      const environment = environmentId
        ? await this.environmentService.findOne(
            environmentId,
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Load each entity and collect all facts
      const allNewFacts = [];
      for (const entityUid of uids) {
        const result = await this.entityLoad({
          payload: {
            userId,
            environmentId,
            entityUid,
          },
          id: message.id,
        });

        if (result.success && (result.data as any)?.facts) {
          allNewFacts.push(...(result.data as any).facts);
        }
      }

      // Deduplicate facts by fact_uid
      const uniqueFacts = Array.from(
        new Map(allNewFacts.map((fact) => [fact.fact_uid, fact])).values()
      );

      // Get updated environment
      const updatedEnvironment = await this.environmentService.findOne(
        environment.id,
        userId.toString()
      );

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: uniqueFacts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load entities", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.ENTITY_UNLOAD_MULTIPLE)
  async entityUnloadMultiple(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        "entity-uids": entityUids,
      } = message.payload;

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Find all facts to remove (those where any entity is on either side)
      const factsToRemove = environment.facts.filter(
        (fact: any) =>
          entityUids.includes(fact.lh_object_uid) ||
          entityUids.includes(fact.rh_object_uid)
      );

      const factUidsToRemove = factsToRemove.map((fact: any) => fact.fact_uid);

      // Remove facts from environment
      const updatedEnvironment = await this.environmentService.removeFacts(
        environment.id,
        userId.toString(),
        factUidsToRemove
      );

      // Find candidate model UIDs to remove
      const candidateModelUids = new Set<number>();
      factsToRemove.forEach((fact: any) => {
        candidateModelUids.add(fact.lh_object_uid);
        candidateModelUids.add(fact.rh_object_uid);
      });

      // Remove models from candidates if they're still referenced in remaining facts
      const remainingFacts = updatedEnvironment.facts;
      const finalModelUidsToRemove = Array.from(candidateModelUids).filter(
        (modelUid) => {
          return !remainingFacts.some(
            (fact: any) =>
              fact.lh_object_uid === modelUid || fact.rh_object_uid === modelUid
          );
        }
      );

      // Broadcast facts unloaded event
      this.broadcastFactsUnloaded(
        factUidsToRemove,
        finalModelUidsToRemove,
        userId,
        environment.id
      );

      return toResponse(
        {
          environment: updatedEnvironment,
          "fact-uids-removed": factUidsToRemove,
          "model-uids-removed": finalModelUidsToRemove,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to unload entities", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.LOAD_ALL_RELATED_FACTS)
  async loadAllRelatedFacts(@MessageBody() message: any) {
    try {
      const result = await this.environmentService.loadAllRelatedFacts(
        message.payload.userId,
        message.payload.environmentId,
        message.payload.uid
      );

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(
        result.facts,
        "" + message.payload.userId,
        message.payload.environmentId
      );

      return toResponse(result, message.id);
    } catch (error) {
      this.logger.error("Failed to load all related facts", error);
      return toErrorResponse(error, message.id);
    }
  }

  // Subtype Operations
  @SubscribeMessage(ApertureActions.SUBTYPE_LOAD)
  async subtypeLoad(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        "entity-uid": entityUid,
      } = message.payload;

      // Get subtypes from Archivist
      const result = await this.archivistClient.getSubtypes(entityUid);

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: facts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load subtypes", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.SUBTYPE_LOAD_CONE)
  async subtypeLoadCone(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        "entity-uid": entityUid,
      } = message.payload;

      // Get subtypes cone from Archivist
      const result = await this.archivistClient.getSubtypesCone(entityUid);

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: facts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load subtypes cone", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.SUBTYPE_UNLOAD_CONE)
  async subtypeUnloadCone(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        "entity-uid": entityUid,
      } = message.payload;

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // This is a complex operation that requires recursive removal of subtype hierarchies
      // For now, we'll implement a simplified version that removes facts where the entity is the RH (parent)
      const factsToRemove = environment.facts.filter(
        (fact: any) =>
          fact.rh_object_uid === entityUid && fact.rel_type_uid === 1146 // 1146 is subtyping relation
      );

      const factUidsToRemove = factsToRemove.map((fact: any) => fact.fact_uid);

      // Remove facts from environment
      const updatedEnvironment = await this.environmentService.removeFacts(
        environment.id,
        userId.toString(),
        factUidsToRemove
      );

      // Find candidate model UIDs to remove
      const candidateModelUids = new Set<number>();
      factsToRemove.forEach((fact: any) => {
        candidateModelUids.add(fact.lh_object_uid);
        candidateModelUids.add(fact.rh_object_uid);
      });

      // Remove models from candidates if they're still referenced in remaining facts
      const remainingFacts = updatedEnvironment.facts;
      const finalModelUidsToRemove = Array.from(candidateModelUids).filter(
        (modelUid) => {
          return !remainingFacts.some(
            (fact: any) =>
              fact.lh_object_uid === modelUid || fact.rh_object_uid === modelUid
          );
        }
      );

      // Broadcast facts unloaded event
      this.broadcastFactsUnloaded(
        factUidsToRemove,
        finalModelUidsToRemove,
        userId.toString(),
        environment.id
      );

      return toResponse(
        {
          environment: updatedEnvironment,
          "fact-uids-removed": factUidsToRemove,
          "model-uids-removed": finalModelUidsToRemove,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to unload subtypes cone", error);
      return toErrorResponse(error, message.id);
    }
  }

  // Classification Operations
  @SubscribeMessage(ApertureActions.CLASSIFICATION_LOAD)
  async classificationLoad(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        "entity-uid": entityUid,
      } = message.payload;

      // Get classified entities from Archivist
      const result = await this.archivistClient.getClassified(entityUid);

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: facts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load classified entities", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.CLASSIFICATION_LOAD_FACT)
  async classificationLoadFact(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        "entity-uid": entityUid,
      } = message.payload;

      // Get classification fact from Archivist
      const result =
        await this.archivistClient.getClassificationFact(entityUid);

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: facts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load classification fact", error);
      return toErrorResponse(error, message.id);
    }
  }

  // Composition Operations
  @SubscribeMessage(ApertureActions.COMPOSITION_LOAD)
  async compositionLoad(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        "entity-uid": entityUid,
      } = message.payload;

      // Get composition relationships from Archivist (1190 is composition relation type)
      const result = await this.archivistClient.getRecursiveRelations(
        entityUid,
        1190
      );

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: facts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load composition relationships", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.COMPOSITION_LOAD_IN)
  async compositionLoadIn(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        "entity-uid": entityUid,
      } = message.payload;

      // Get incoming composition relationships from Archivist (1190 is composition relation type)
      const result = await this.archivistClient.getRecursiveRelationsTo(
        entityUid,
        1190
      );

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: facts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error(
        "Failed to load incoming composition relationships",
        error
      );
      return toErrorResponse(error, message.id);
    }
  }

  // Connection Operations
  @SubscribeMessage(ApertureActions.CONNECTION_LOAD)
  async connectionLoad(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        "entity-uid": entityUid,
      } = message.payload;

      // Get connection relationships from Archivist (1487 is connection relation type)
      const result = await this.archivistClient.getRecursiveRelations(
        entityUid,
        1487
      );

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: facts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load connection relationships", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.CONNECTION_LOAD_IN)
  async connectionLoadIn(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        "entity-uid": entityUid,
      } = message.payload;

      // Get incoming connection relationships from Archivist (1487 is connection relation type)
      const result = await this.archivistClient.getRecursiveRelationsTo(
        entityUid,
        1487
      );

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Add facts to environment
      const facts = result.facts || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: facts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error(
        "Failed to load incoming connection relationships",
        error
      );
      return toErrorResponse(error, message.id);
    }
  }

  // Relation Operations
  @SubscribeMessage(ApertureActions.RELATION_REQUIRED_ROLES_LOAD)
  async relationRequiredRolesLoad(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        uid,
      } = message.payload;

      // Get required roles from Archivist
      const result = await this.archivistClient.getRequiredRoles(uid);

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
        : await this.environmentService.findDefaultForUser(userId.toString());

      // Add facts to environment
      const facts = result.data || [];
      let updatedEnvironment = environment;
      if (facts.length > 0) {
        updatedEnvironment = await this.environmentService.addFacts(
          environment.id,
          userId.toString(),
          facts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: facts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load required roles", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(ApertureActions.RELATION_ROLE_PLAYERS_LOAD)
  async relationRolePlayersLoad(@MessageBody() message: any) {
    try {
      const {
        "user-id": userId,
        "environment-id": envId,
        uid,
      } = message.payload;

      // Get role players from Archivist
      const result = await this.archivistClient.getRolePlayers(uid);

      // Get environment
      const environment = envId
        ? await this.environmentService.findOne(
            envId.toString(),
            userId.toString()
          )
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
          facts
        );
      }

      // Broadcast facts loaded event
      this.broadcastFactsLoaded(facts, userId.toString(), environment.id);

      return toResponse(
        {
          environment: updatedEnvironment,
          facts: facts,
        },
        message.id
      );
    } catch (error) {
      this.logger.error("Failed to load role players", error);
      return toErrorResponse(error, message.id);
    }
  }
}
