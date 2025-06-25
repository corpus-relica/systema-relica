import { Injectable, Logger } from '@nestjs/common';
import { ArchivistService } from '../archivist/archivist.service';
import { EntityModelService } from './entity-model.service';

export interface RoleModel {
  uid: number;
  name: string;
  nature: 'kind' | 'individual';
  category: 'role';
  definitions?: string[];
  supertypes?: number[];
  synonyms?: string[];
  classifiers?: number[];
  rolePlayers?: Array<{
    uid: number;
    name: string;
    relation_uid: number;
  }>;
  requiredInRelations?: Array<{
    uid: number;
    name: string;
    role_position: 1 | 2;
  }>;
  possibleInRelations?: Array<{
    uid: number;
    name: string;
  }>;
}

@Injectable()
export class RoleModelService {
  private readonly logger = new Logger(RoleModelService.name);

  constructor(
    private readonly archivistService: ArchivistService,
    private readonly entityModelService: EntityModelService,
  ) {}

  /**
   * Retrieve and transform a kind of role to its semantic model representation
   */
  async retrieveKindOfRoleModel(uid: number): Promise<RoleModel> {
    try {
      // Get base entity model
      const baseModel =
        await this.entityModelService.retrieveKindOfEntityModel(uid);

      // Get all facts related to this role
      const facts = await this.archivistService.retrieveAllFacts(uid);

      // Get role players (entities that can play this role)
      const rolePlayers = facts
        .filter((f) => f.rel_type_name?.includes('plays role'))
        .map((f) => ({
          uid: f.lh_object_uid,
          name: f.lh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Get required relations (relations that require this role)
      // 4731: required-role-1, 4733: required-role-2
      const requiredInRelations = facts
        .filter((f) => f.rel_type_uid === 4731 || f.rel_type_uid === 4733)
        .map((f) => ({
          uid: f.lh_object_uid,
          name: f.lh_object_name,
          role_position: (f.rel_type_uid === 4731 ? 1 : 2) as 1 | 2,
        }));

      // Get possible relations (relations where this role can be used)
      // 4714: possible-role
      const possibleInRelations = facts
        .filter((f) => f.rel_type_uid === 4714)
        .map((f) => ({
          uid: f.lh_object_uid,
          name: f.lh_object_name,
        }));

      this.logger.log(
        `Retrieved kind role model for UID ${uid}: ${baseModel.name}`,
      );

      return {
        ...baseModel,
        category: 'role',
        rolePlayers,
        requiredInRelations,
        possibleInRelations,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve kind role model for UID ${uid}:`,
        error,
      );
      throw new Error(`Error retrieving kind role model: ${error.message}`);
    }
  }

  /**
   * Retrieve and transform an individual role to its semantic model representation
   * Note: Individual roles are intentionally omitted in the Clojure implementation
   * but included here for completeness
   */
  async retrieveIndividualRoleModel(uid: number): Promise<RoleModel> {
    try {
      this.logger.log(
        `Retrieving individual role model for UID ${uid} (note: uncommon use case)`,
      );

      // Get base entity model
      const baseModel =
        await this.entityModelService.retrieveIndividualEntityModel(uid);

      // Get all facts related to this role instance
      const facts = await this.archivistService.retrieveAllFacts(uid);

      // For individual roles, get the actual players
      const rolePlayers = facts
        .filter((f) => f.rel_type_name?.includes('plays role'))
        .map((f) => ({
          uid: f.lh_object_uid,
          name: f.lh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      this.logger.log(
        `Retrieved individual role model for UID ${uid}: ${baseModel.name}`,
      );

      return {
        ...baseModel,
        category: 'role',
        rolePlayers,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve individual role model for UID ${uid}:`,
        error,
      );
      throw new Error(
        `Error retrieving individual role model: ${error.message}`,
      );
    }
  }
}
