import { Injectable, Logger } from '@nestjs/common';
import { ArchivistService } from '../archivist/archivist.service';

export interface EntityModelData {
  names: string[];
  supertypes: number[];
  definitions: string[];
}

export interface EntityStuffData {
  classifications: any[];
  specializations: any[];
  qualifications: any[];
  synonyms: string[];
}

export interface KindEntityModel {
  uid: number;
  name: string;
  nature: 'kind';
  definitions: string[];
  supertypes: number[];
  synonyms: string[];
}

export interface IndividualEntityModel {
  uid: number;
  name: string;
  nature: 'individual';
  classifiers: number[];
}

@Injectable()
export class EntityModelService {
  private readonly logger = new Logger(EntityModelService.name);

  constructor(private readonly archivistService: ArchivistService) {}

  /**
   * Retrieve supertypes and definitions for an entity
   */
  async retrieveSupertypesAndDefinitions(
    uid: number,
  ): Promise<EntityModelData> {
    try {
      const definitiveFacts =
        await this.archivistService.getDefinitiveFacts(uid);
      const names = definitiveFacts.map((f) => f.lh_object_name);
      const supertypes = definitiveFacts.map((f) => f.rh_object_uid);
      const definitions = definitiveFacts.map((f) => f.full_definition);

      return {
        names,
        supertypes,
        definitions,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve supertypes and definitions for UID ${uid}:`,
        error,
      );
      throw new Error(`Error retrieving entity data: ${error.message}`);
    }
  }

  /**
   * Retrieve classifiers for an individual entity
   */
  async retrieveClassifiers(uid: number) {
    try {
      const classifiers = await this.archivistService.getDefinitiveFacts(uid);
      this.logger.debug(
        `Retrieved ${classifiers.length} classifiers for UID ${uid}`,
      );
      return classifiers;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve classifiers for UID ${uid}:`,
        error,
      );
      throw new Error(`Error retrieving classifiers: ${error.message}`);
    }
  }

  /**
   * Retrieve related facts for an entity (classifications, specializations, etc.)
   */
  async retrieveStuff(uid: number): Promise<EntityStuffData> {
    try {
      const stuff = await this.archivistService.retrieveAllFacts(uid);

      // Filter by relation type UIDs (matching Clojure implementation)
      const classifications = stuff.filter((f) => f.rel_type_uid === 1225);
      const specializations = stuff.filter((f) => f.rel_type_uid === 1146);
      const qualifications = stuff.filter((f) => f.rel_type_uid === 1726);

      // Extract unique synonyms
      const synonyms: string[] = Array.from(
        new Set(
          stuff
            .filter((f) => f.rel_type_uid === 1981)
            .map((f) => f.lh_object_name)
            .filter((name): name is string => typeof name === 'string'),
        ),
      );

      this.logger.debug(
        `Retrieved stuff for UID ${uid}: ${classifications.length} classifications, ${specializations.length} specializations, ${qualifications.length} qualifications, ${synonyms.length} synonyms`,
      );

      return {
        classifications,
        specializations,
        qualifications,
        synonyms,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve stuff for UID ${uid}:`, error);
      throw new Error(`Error retrieving related facts: ${error.message}`);
    }
  }

  /**
   * Retrieve and transform a kind entity to its semantic model representation
   */
  async retrieveKindOfEntityModel(uid: number): Promise<KindEntityModel> {
    try {
      const { names, supertypes, definitions } =
        await this.retrieveSupertypesAndDefinitions(uid);
      const stuff = await this.retrieveStuff(uid);

      this.logger.log(
        `Retrieved kind entity model for UID ${uid}: ${names[0]}`,
      );

      return {
        uid,
        name: names[0] || '',
        nature: 'kind',
        definitions,
        supertypes,
        synonyms: stuff.synonyms,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve kind entity model for UID ${uid}:`,
        error,
      );
      throw new Error(`Error retrieving kind entity model: ${error.message}`);
    }
  }

  /**
   * Retrieve and transform an individual entity to its semantic model representation
   */
  async retrieveIndividualEntityModel(
    uid: number,
  ): Promise<IndividualEntityModel> {
    try {
      const classifiers = await this.retrieveClassifiers(uid);

      this.logger.log(`Retrieved individual entity model for UID ${uid}`);

      return {
        uid,
        name: classifiers[0]?.lh_object_name || '',
        nature: 'individual',
        classifiers: classifiers.map((c) => c.rh_object_uid),
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve individual entity model for UID ${uid}:`,
        error,
      );
      throw new Error(
        `Error retrieving individual entity model: ${error.message}`,
      );
    }
  }
}
