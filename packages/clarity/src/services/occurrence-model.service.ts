import { Injectable, Logger } from '@nestjs/common';
import { ArchivistService } from '../archivist/archivist.service';
import { EntityModelService } from './entity-model.service';

export interface OccurrenceModel {
  uid: number;
  name: string;
  nature: 'kind' | 'individual';
  category: 'occurrence';
  definitions?: string[];
  supertypes?: number[];
  synonyms?: string[];
  classifiers?: number[];
  aspects?: Array<{
    uid: number;
    name: string;
    relation_uid: number;
  }>;
  involved?: Array<{
    uid: number;
    name: string;
    relation_uid: number;
  }>;
  temporalAspects?: {
    beginTime?: {
      uid: number;
      name: string;
      value?: string;
    } | null;
    endTime?: {
      uid: number;
      name: string;
      value?: string;
    } | null;
    duration?: {
      uid: number;
      name: string;
      value?: string;
    } | null;
  };
  causedBy?: Array<{
    uid: number;
    name: string;
  }>;
  causes?: Array<{
    uid: number;
    name: string;
  }>;
}

@Injectable()
export class OccurrenceModelService {
  private readonly logger = new Logger(OccurrenceModelService.name);

  constructor(
    private readonly archivistService: ArchivistService,
    private readonly entityModelService: EntityModelService,
  ) {}

  /**
   * Retrieve and transform a kind of occurrence to its semantic model representation
   */
  async retrieveKindOfOccurrenceModel(uid: number): Promise<OccurrenceModel> {
    try {
      // Get base entity model
      const baseModel =
        await this.entityModelService.retrieveKindOfEntityModel(uid);

      // Get all facts related to this occurrence
      const facts = await this.archivistService.retrieveAllFacts(uid);

      // Get aspects of this occurrence type
      const aspects = facts
        .filter((f) => f.rel_type_name?.includes('has aspect'))
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Get involved entities (things typically involved in this occurrence type)
      // 5644: involves
      const involved = facts
        .filter((f) => f.rel_type_uid === 5644)
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Get temporal aspects (begin time, end time, duration concepts)
      const beginTimeFact = facts.find((f) =>
        f.rel_type_name?.includes('begin time'),
      );
      const endTimeFact = facts.find((f) =>
        f.rel_type_name?.includes('end time'),
      );
      const durationFact = facts.find((f) =>
        f.rel_type_name?.includes('duration'),
      );

      const temporalAspects = {
        beginTime: beginTimeFact
          ? {
              uid: beginTimeFact.rh_object_uid,
              name: beginTimeFact.rh_object_name,
            }
          : null,
        endTime: endTimeFact
          ? {
              uid: endTimeFact.rh_object_uid,
              name: endTimeFact.rh_object_name,
            }
          : null,
        duration: durationFact
          ? {
              uid: durationFact.rh_object_uid,
              name: durationFact.rh_object_name,
            }
          : null,
      };

      // Get causality relationships
      const causedBy = facts
        .filter((f) => f.rel_type_name?.includes('caused by'))
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
        }));

      const causes = facts
        .filter((f) => f.rel_type_name?.includes('causes'))
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
        }));

      this.logger.log(
        `Retrieved kind occurrence model for UID ${uid}: ${baseModel.name}`,
      );

      return {
        ...baseModel,
        category: 'occurrence',
        aspects,
        involved,
        temporalAspects,
        causedBy,
        causes,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve kind occurrence model for UID ${uid}:`,
        error,
      );
      throw new Error(
        `Error retrieving kind occurrence model: ${error.message}`,
      );
    }
  }

  /**
   * Retrieve and transform an individual occurrence to its semantic model representation
   */
  async retrieveIndividualOccurrenceModel(
    uid: number,
  ): Promise<OccurrenceModel> {
    try {
      this.logger.log(`Retrieving individual occurrence model for UID ${uid}`);

      // Get base entity model
      const baseModel =
        await this.entityModelService.retrieveIndividualEntityModel(uid);

      // Get all facts related to this occurrence instance
      const facts = await this.archivistService.retrieveAllFacts(uid);

      // Get actual aspects of this occurrence instance
      const aspects = facts
        .filter((f) => f.rel_type_name?.includes('has aspect'))
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Get actually involved entities
      const involved = facts
        .filter((f) => f.rel_type_uid === 5644)
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Get actual temporal aspects with values
      const beginTimeFact = facts.find((f) =>
        f.rel_type_name?.includes('begin time'),
      );
      const endTimeFact = facts.find((f) =>
        f.rel_type_name?.includes('end time'),
      );
      const durationFact = facts.find((f) =>
        f.rel_type_name?.includes('duration'),
      );

      const temporalAspects = {
        beginTime: beginTimeFact
          ? {
              uid: beginTimeFact.rh_object_uid,
              name: beginTimeFact.rh_object_name,
              value: beginTimeFact.full_definition,
            }
          : null,
        endTime: endTimeFact
          ? {
              uid: endTimeFact.rh_object_uid,
              name: endTimeFact.rh_object_name,
              value: endTimeFact.full_definition,
            }
          : null,
        duration: durationFact
          ? {
              uid: durationFact.rh_object_uid,
              name: durationFact.rh_object_name,
              value: durationFact.full_definition,
            }
          : null,
      };

      // Get actual causality relationships
      const causedBy = facts
        .filter((f) => f.rel_type_name?.includes('caused by'))
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
        }));

      const causes = facts
        .filter((f) => f.rel_type_name?.includes('causes'))
        .map((f) => ({
          uid: f.rh_object_uid,
          name: f.rh_object_name,
        }));

      this.logger.log(
        `Retrieved individual occurrence model for UID ${uid}: ${baseModel.name}`,
      );

      return {
        ...baseModel,
        category: 'occurrence',
        aspects,
        involved,
        temporalAspects,
        causedBy,
        causes,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve individual occurrence model for UID ${uid}:`,
        error,
      );
      throw new Error(
        `Error retrieving individual occurrence model: ${error.message}`,
      );
    }
  }
}
