import { Injectable, Logger } from '@nestjs/common';
import { ArchivistService } from '../archivist/archivist.service';
import { EntityModelService } from './entity-model.service';
import { PhysicalObjectModelService } from './physical-object-model.service';
import { AspectModelService } from './aspect-model.service';
import { RoleModelService } from './role-model.service';
import { RelationModelService } from './relation-model.service';
import { OccurrenceModelService } from './occurrence-model.service';
import { CATEGORY_CONSTANTS, ENTITY_NATURE } from '../constants';

import { decodeRequest } from '@relica/websocket-contracts';

export type SemanticModel = any; // Union of all model types

@Injectable()
export class SemanticModelService {
  private readonly logger = new Logger(SemanticModelService.name);

  constructor(
    private readonly archivistService: ArchivistService,
    private readonly entityModelService: EntityModelService,
    private readonly physicalObjectModelService: PhysicalObjectModelService,
    private readonly aspectModelService: AspectModelService,
    private readonly roleModelService: RoleModelService,
    private readonly relationModelService: RelationModelService,
    private readonly occurrenceModelService: OccurrenceModelService,
  ) {}

  /**
   * Main semantic model retrieval function that orchestrates all other services
   * Matches the Clojure implementation's retrieve-semantic-model function
   */
  async retrieveSemanticModel(uid: number): Promise<SemanticModel> {
    try {
      this.logger.debug(`Retrieving semantic model for UID: ${uid}`);

      // 1. Get entity type and category directly
      const entityType = await this.archivistService.getEntityType(uid);
      const type = decodeRequest(entityType).type;
      // this.logger.debug(`Entity type: ${JSON.stringify(entityType)}`);
      console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
      console.log(type)

      const category = await this.archivistService.getCategory(uid);
      const cat = decodeRequest(category);
      console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
      console.log(cat)
      // this.logger.debug(`Entity category: ${cat}`);

      // 2. Route to appropriate service based on entity type and category
      switch (entityType.type) {
        case ENTITY_NATURE.KIND:
          return await this.handleKindEntity(uid, category);

        case ENTITY_NATURE.INDIVIDUAL:
          return await this.handleIndividualEntity(uid, category);

        default:
          this.logger.warn(
            `Unknown entity type: ${entityType.type} for UID: ${uid}`,
          );
          return {};
      }
    } catch (error) {
      this.logger.error(
        `Error retrieving semantic model for UID ${uid}:`,
        error,
      );
      throw new Error(`Error retrieving semantic model: ${error.message}`);
    }
  }

  /**
   * Handle kind entities by routing to appropriate category service
   */
  private async handleKindEntity(
    uid: number,
    category: string,
  ): Promise<SemanticModel> {
    switch (category) {
      case CATEGORY_CONSTANTS.PHYSICAL_OBJECT:
        return await this.physicalObjectModelService.retrieveKindOfPhysicalObjectModel(
          uid,
        );

      case CATEGORY_CONSTANTS.ASPECT:
        return await this.aspectModelService.retrieveKindOfAspectModel(uid);

      case CATEGORY_CONSTANTS.ROLE:
        return await this.roleModelService.retrieveKindOfRoleModel(uid);

      case CATEGORY_CONSTANTS.RELATION:
        return await this.relationModelService.retrieveKindOfRelationModel(uid);

      case CATEGORY_CONSTANTS.OCCURRENCE:
        return await this.occurrenceModelService.retrieveKindOfOccurrenceModel(
          uid,
        );

      case CATEGORY_CONSTANTS.ANYTHING:
        return await this.entityModelService.retrieveKindOfEntityModel(uid);

      default:
        this.logger.warn(
          `Unknown category for kind entity: ${category} for UID: ${uid}`,
        );
        return {};
    }
  }

  /**
   * Handle individual entities by routing to appropriate category service
   */
  private async handleIndividualEntity(
    uid: number,
    category: string,
  ): Promise<SemanticModel> {
    switch (category) {
      case CATEGORY_CONSTANTS.PHYSICAL_OBJECT:
        return await this.physicalObjectModelService.retrieveIndividualPhysicalObjectModel(
          uid,
        );

      case CATEGORY_CONSTANTS.ASPECT:
        return await this.aspectModelService.retrieveIndividualAspectModel(uid);

      case CATEGORY_CONSTANTS.RELATION:
        return await this.relationModelService.retrieveIndividualRelationModel(
          uid,
        );

      case CATEGORY_CONSTANTS.OCCURRENCE:
        return await this.occurrenceModelService.retrieveIndividualOccurrenceModel(
          uid,
        );

      // Note: Individual roles are intentionally omitted (as in Clojure implementation)
      // case CATEGORY_CONSTANTS.ROLE:
      //   return await this.roleModelService.retrieveIndividualRoleModel(uid);

      default:
        this.logger.warn(
          `Unknown category for individual entity: ${category} for UID: ${uid}`,
        );
        return {};
    }
  }

  /**
   * Retrieve multiple semantic models in batch (with throttling)
   */
  async retrieveSemanticModels(uids: number[]): Promise<SemanticModel[]> {
    try {
      this.logger.debug(
        `Retrieving batch semantic models for UIDs: ${uids.join(', ')}`,
      );

      // Use the existing throttlePromises method from the original model service
      const funcs = uids.map((uid) => () => this.retrieveSemanticModel(uid));
      return await this.throttlePromises(funcs, 5);
    } catch (error) {
      this.logger.error(`Error retrieving batch semantic models:`, error);
      throw new Error(
        `Error retrieving batch semantic models: ${error.message}`,
      );
    }
  }

  /**
   * Throttle promise execution to prevent overwhelming the system
   * Copied from the original model.service.ts
   */
  private async throttlePromises(
    funcs: (() => Promise<any>)[],
    limit: number,
  ): Promise<any[]> {
    const results: Promise<any>[] = [];
    const executing: Promise<any>[] = [];

    for (const func of funcs) {
      const p = Promise.resolve().then(func);
      results.push(p);

      if (limit <= funcs.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);

        if (executing.length >= limit) {
          await Promise.race(executing);
        }
      }
    }

    return Promise.all(results);
  }

  /**
   * Service lifecycle management
   */
  start(): void {
    this.logger.log('Initializing semantic model service...');
  }

  stop(): void {
    this.logger.log('Shutting down semantic model service...');
  }
}
