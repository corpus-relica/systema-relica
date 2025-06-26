import { Injectable, Logger } from '@nestjs/common';
import { ArchivistService } from '../archivist/archivist.service';
import { EntityModelService } from './entity-model.service';

export interface AspectModel {
  uid: number;
  name: string;
  nature: 'kind' | 'individual';
  category: 'aspect';
  definitions?: string[];
  supertypes?: number[];
  synonyms?: string[];
  classifiers?: number[];
  possessors?: Array<{
    uid: number;
    name: string;
    relation_uid: number;
  }>;
  isQuantitative?: boolean;
  unitOfMeasure?: {
    uid: number;
    name: string;
  } | null;
  value?: {
    quant: number;
    uom: {
      uid: number;
      name: string;
    };
  };
}

@Injectable()
export class AspectModelService {
  private readonly logger = new Logger(AspectModelService.name);

  constructor(
    private readonly archivistService: ArchivistService,
    private readonly entityModelService: EntityModelService,
  ) {}

  /**
   * Retrieve and transform a kind of aspect to its semantic model representation
   */
  async retrieveKindOfAspectModel(uid: number): Promise<AspectModel> {
    try {
      // Get base entity model
      const baseModel =
        await this.entityModelService.retrieveKindOfEntityModel(uid);

      // Get all facts related to this aspect
      const facts = await this.archivistService.retrieveAllFacts(uid);

      // Get possessors (entities that can have this aspect)
      const possessors = facts
        .filter((f) => f.rel_type_name?.includes('has aspect'))
        .map((f) => ({
          uid: f.lh_object_uid,
          name: f.lh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Check if this is a quantitative aspect (has unit of measure)
      const isQuantitative = facts.some((f) =>
        f.rel_type_name?.includes('unit of measure'),
      );

      const unitOfMeasureFact = facts.find((f) =>
        f.rel_type_name?.includes('unit of measure'),
      );

      const unitOfMeasure = unitOfMeasureFact
        ? {
            uid: unitOfMeasureFact.rh_object_uid,
            name: unitOfMeasureFact.rh_object_name,
          }
        : null;

      this.logger.log(
        `Retrieved kind aspect model for UID ${uid}: ${baseModel.name}`,
      );

      return {
        ...baseModel,
        category: 'aspect',
        possessors,
        isQuantitative,
        unitOfMeasure,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve kind aspect model for UID ${uid}:`,
        error,
      );
      throw new Error(`Error retrieving kind aspect model: ${error.message}`);
    }
  }

  /**
   * Retrieve and transform an individual aspect to its semantic model representation
   */
  async retrieveIndividualAspectModel(uid: number): Promise<AspectModel> {
    try {
      this.logger.log(`Retrieving individual aspect model for UID ${uid}`);

      // Get base entity model
      const baseModel =
        await this.entityModelService.retrieveIndividualEntityModel(uid);

      // Get all facts related to this aspect
      const facts = await this.archivistService.retrieveAllFacts(uid);

      // For individual aspects, get the actual possessor
      const possessors = facts
        .filter((f) => f.rel_type_name?.includes('has aspect'))
        .map((f) => ({
          uid: f.lh_object_uid,
          name: f.lh_object_name,
          relation_uid: f.rel_type_uid,
        }));

      // Check if this individual aspect has a value (for quantitative aspects)
      const value = await this.archivistService.getRelatedOnUIDSubtypeCone(
        uid,
        5025,
      ); // 'has on scale a value equal to'

      let aspectValue;
      if (value && value.length > 0) {
        const valFact = value[0];
        aspectValue = {
          quant: parseInt(valFact.rh_object_name),
          uom: {
            uid: valFact.uom_uid,
            name: valFact.uom_name,
          },
        };
      }

      this.logger.log(
        `Retrieved individual aspect model for UID ${uid}: ${baseModel.name}`,
      );

      return {
        ...baseModel,
        category: 'aspect',
        possessors,
        value: aspectValue,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve individual aspect model for UID ${uid}:`,
        error,
      );
      throw new Error(
        `Error retrieving individual aspect model: ${error.message}`,
      );
    }
  }
}
