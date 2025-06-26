import { Injectable, Logger } from '@nestjs/common';
import { ArchivistService } from '../archivist/archivist.service';
import { EntityModelService } from './entity-model.service';

export interface PhysicalObjectModel {
  uid: number;
  name: string;
  nature: 'kind' | 'individual';
  category: 'physical object';
  definitions?: string[];
  supertypes?: number[];
  synonyms?: string[];
  classifiers?: number[];
  aspects?: Array<{
    uid: number;
    name: string;
    relation_uid: number;
  }>;
  roles?: Array<{
    uid: number;
    name: string;
    relation_uid: number;
  }>;
  components?: Array<{
    uid: number;
    name: string;
    relation_uid: number;
  }>;
  connections?: Array<{
    uid: number;
    name: string;
    relation_uid: number;
  }>;
}

@Injectable()
export class PhysicalObjectModelService {
  private readonly logger = new Logger(PhysicalObjectModelService.name);

  constructor(
    private readonly archivistService: ArchivistService,
    private readonly entityModelService: EntityModelService,
  ) {}

  /**
   * Retrieve and transform a kind of physical object to its semantic model representation
   */
  async retrieveKindOfPhysicalObjectModel(
    uid: number,
  ): Promise<PhysicalObjectModel> {
    try {
      // Get base entity model
      const baseModel =
        await this.entityModelService.retrieveKindOfEntityModel(uid);

      // Get all facts related to this physical object
      const facts = await this.archivistService.retrieveAllFacts(uid);

      // Get aspects (things this physical object has)
      const aspects = facts
        .filter((f) => f.rel_type_name?.includes('has aspect'))
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Get roles (roles this physical object can play)
      const roles = facts
        .filter((f) => f.rel_type_name?.includes('plays role'))
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Get parts/components (things this object is composed of)
      const components = facts
        .filter((f) => f.rel_type_name?.includes('part of'))
        .map((f) => ({
          uid: f.lh_object_uid,
          name: f.lh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Get connections (other objects this is connected to)
      const connections = facts
        .filter((f) => f.rel_type_name?.includes('connected'))
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      this.logger.log(
        `Retrieved kind physical object model for UID ${uid}: ${baseModel.name}`,
      );

      return {
        ...baseModel,
        category: 'physical object',
        aspects,
        roles,
        components,
        connections,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve kind physical object model for UID ${uid}:`,
        error,
      );
      throw new Error(
        `Error retrieving kind physical object model: ${error.message}`,
      );
    }
  }

  /**
   * Retrieve and transform an individual physical object to its semantic model representation
   */
  async retrieveIndividualPhysicalObjectModel(
    uid: number,
  ): Promise<PhysicalObjectModel> {
    try {
      // Get base entity model
      const baseModel =
        await this.entityModelService.retrieveIndividualEntityModel(uid);

      // Get all facts related to this physical object
      const facts = await this.archivistService.retrieveAllFacts(uid);

      // For individuals, we might have actual aspect values rather than potential aspects
      const aspects = facts
        .filter((f) => f.rel_type_name?.includes('has aspect'))
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Individual roles currently being played
      const roles = facts
        .filter((f) => f.rel_type_name?.includes('plays role'))
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Actual components of this individual
      const components = facts
        .filter((f) => f.rel_type_name?.includes('part of'))
        .map((f) => ({
          uid: f.lh_object_uid,
          name: f.lh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Actual connections of this individual
      const connections = facts
        .filter((f) => f.rel_type_name?.includes('connected'))
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      this.logger.log(
        `Retrieved individual physical object model for UID ${uid}: ${baseModel.name}`,
      );

      return {
        ...baseModel,
        category: 'physical object',
        aspects,
        roles,
        components,
        connections,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve individual physical object model for UID ${uid}:`,
        error,
      );
      throw new Error(
        `Error retrieving individual physical object model: ${error.message}`,
      );
    }
  }
}
