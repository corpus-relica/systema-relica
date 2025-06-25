import { Injectable, Logger } from '@nestjs/common';
import { ArchivistService } from '../archivist/archivist.service';
import { EntityModelService } from './entity-model.service';

export interface RelationModel {
  uid: number;
  name: string;
  nature: 'kind' | 'individual';
  category: 'relation';
  definitions?: string[];
  supertypes?: number[];
  synonyms?: string[];
  classifiers?: number[];
  requiredRole1?: {
    uid: number;
    name: string;
  } | null;
  requiredRole2?: {
    uid: number;
    name: string;
  } | null;
  inverseRelation?: {
    uid: number;
    name: string;
  } | null;
  possibleRoles?: Array<{
    uid: number;
    name: string;
  }>;
  relator?: {
    uid: number;
    name: string;
  };
  related?: Array<{
    uid: number;
    name: string;
    role: string;
  }>;
}

@Injectable()
export class RelationModelService {
  private readonly logger = new Logger(RelationModelService.name);

  constructor(
    private readonly archivistService: ArchivistService,
    private readonly entityModelService: EntityModelService,
  ) {}

  /**
   * Retrieve and transform a kind of relation to its semantic model representation
   */
  async retrieveKindOfRelationModel(uid: number): Promise<RelationModel> {
    try {
      // Get base entity model
      const baseModel =
        await this.entityModelService.retrieveKindOfEntityModel(uid);

      // Get all facts related to this relation
      const facts = await this.archivistService.retrieveAllFacts(uid);

      // Get required roles for this relation
      // 4731: required-role-1
      const requiredRole1Fact = facts.find((f) => f.rel_type_uid === 4731);
      const requiredRole1 = requiredRole1Fact
        ? {
            uid: requiredRole1Fact.rh_object_uid,
            name: requiredRole1Fact.rh_object_name,
          }
        : null;

      // 4733: required-role-2
      const requiredRole2Fact = facts.find((f) => f.rel_type_uid === 4733);
      const requiredRole2 = requiredRole2Fact
        ? {
            uid: requiredRole2Fact.rh_object_uid,
            name: requiredRole2Fact.rh_object_name,
          }
        : null;

      // Get inverse relation if any
      // 1986: inverse
      const inverseRelationFact = facts.find((f) => f.rel_type_uid === 1986);
      const inverseRelation = inverseRelationFact
        ? {
            uid: inverseRelationFact.rh_object_uid,
            name: inverseRelationFact.rh_object_name,
          }
        : null;

      // Get possible roles (optional roles that can be used with this relation)
      // 4714: possible-role
      const possibleRoles = facts
        .filter((f) => f.rel_type_uid === 4714)
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
        }));

      this.logger.log(
        `Retrieved kind relation model for UID ${uid}: ${baseModel.name}`,
      );

      return {
        ...baseModel,
        category: 'relation',
        requiredRole1,
        requiredRole2,
        inverseRelation,
        possibleRoles,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve kind relation model for UID ${uid}:`,
        error,
      );
      throw new Error(`Error retrieving kind relation model: ${error.message}`);
    }
  }

  /**
   * Retrieve and transform an individual relation to its semantic model representation
   */
  async retrieveIndividualRelationModel(uid: number): Promise<RelationModel> {
    try {
      this.logger.log(`Retrieving individual relation model for UID ${uid}`);

      // Get base entity model
      const baseModel =
        await this.entityModelService.retrieveIndividualEntityModel(uid);

      // Get all facts related to this relation instance
      const facts = await this.archivistService.retrieveAllFacts(uid);

      // For individual relations, we need to find the relator and related entities
      // The relator is typically the left-hand object in the relation fact
      const relatorFact = facts.find((f) => f.lh_object_uid === uid);
      const relator = relatorFact
        ? {
            uid: relatorFact.lh_object_uid,
            name: relatorFact.lh_object_name,
          }
        : undefined;

      // Get all related entities (those connected through this relation instance)
      const related = facts
        .filter((f) => f.rel_type_uid === uid || f.fact_uid === uid)
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
          role: f.rh_role_name || 'unknown',
        }));

      this.logger.log(
        `Retrieved individual relation model for UID ${uid}: ${baseModel.name}`,
      );

      return {
        ...baseModel,
        category: 'relation',
        relator,
        related,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve individual relation model for UID ${uid}:`,
        error,
      );
      throw new Error(
        `Error retrieving individual relation model: ${error.message}`,
      );
    }
  }
}
