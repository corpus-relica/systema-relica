import { Injectable, Logger } from '@nestjs/common';
import { ArchivistSocketClient } from '@relica/websocket-clients';

@Injectable()
export class ArchivistService {
  private readonly logger = new Logger(ArchivistService.name);

  constructor(private webSocketClient: ArchivistSocketClient) {}

  async getSpecializationHierarchy(uid: number) {
    this.logger.log(`Getting specialization hierarchy for uid: ${uid}`);
    return this.webSocketClient.getSpecializationHierarchy(uid);
  }

  async getSpecializationFact(uid: number, userId: number = 1) {
    this.logger.log(`Getting specialization fact for uid: ${uid}`);
    return this.webSocketClient.getSpecializationFact(userId, uid);
  }

  async getSubtypes(uid: number) {
    this.logger.log(`Getting subtypes for uid: ${uid}`);
    return this.webSocketClient.getSubtypes(uid);
  }

  async getSubtypesCone(uid: number) {
    this.logger.log(`Getting subtypes cone for uid: ${uid}`);
    return this.webSocketClient.getSubtypesCone(uid);
  }

  async getFact(uid: number) {
    this.logger.log(`Getting fact for uid: ${uid}`);
    return this.webSocketClient.getFact(uid);
  }

  async getFacts(factUIDs: number[]) {
    this.logger.log(`Getting facts for uids: ${factUIDs.join(', ')}`);
    return this.webSocketClient.getFacts(factUIDs);
  }

  async getEntity(uid: number) {
    this.logger.log(`Getting entity for uid: ${uid}`);
    return this.webSocketClient.getEntity(uid);
  }

  async retrieveAllFacts(uid: number) {
    this.logger.log(`Retrieving all facts for uid: ${uid}`);
    return this.webSocketClient.retrieveAllFacts(uid);
  }

  async getCategory(uid: number) {
    this.logger.log(`Getting category for uid: ${uid}`);
    return this.webSocketClient.getCategory(uid);
  }

  async getDefinitiveFacts(uid: number) {
    this.logger.log(`Getting definitive facts for uid: ${uid}`);
    return this.webSocketClient.getDefinitiveFacts(uid);
  }

  async getRelatedOnUIDSubtypeCone(
    lh_object_uid: number,
    rel_type_uid: number,
  ) {
    this.logger.log(`Getting related on UID subtype cone for lh_object_uid: ${lh_object_uid}, rel_type_uid: ${rel_type_uid}`);
    return this.webSocketClient.getRelatedOnUIDSubtypeCone(lh_object_uid, rel_type_uid);
  }

  async getEntityType(uid: number) {
    this.logger.log(`Getting entity type for uid: ${uid}`);
    return this.webSocketClient.getEntityType(uid);
  }

  async getFactsRelatingEntities(uid1: number, uid2: number) {
    this.logger.log(`Getting facts relating entities uid1: ${uid1}, uid2: ${uid2}`);
    return this.webSocketClient.getFactsRelatingEntities(uid1, uid2);
  }

  async textSearchExact(searchTerm: string) {
    this.logger.log(`Performing exact text search for: ${searchTerm}`);
    const result = await this.webSocketClient.textSearchExact(searchTerm);
    console.log('TEXT SEARCH EXACT: ', result);
    return result;
  }

  async createKind(
    parentUID: number,
    parentName: string,
    name: string,
    definition: string,
  ) {
    this.logger.log(`Creating kind: ${name} as specialization of ${parentName} (${parentUID})`);
    return this.webSocketClient.createKind(parentUID, parentName, name, definition);
  }

  async createIndividual(
    kindUID: number,
    kindName: string,
    name: string,
    definition: string,
  ) {
    this.logger.log(`Creating individual: ${name} classified as ${kindName} (${kindUID})`);
    return this.webSocketClient.createIndividual(kindUID, kindName, name, definition);
  }

  async deleteEntity(uid: number) {
    this.logger.log(`Deleting entity for uid: ${uid}`);
    return this.webSocketClient.deleteEntity(uid);
  }

  async deleteFact(uid: number) {
    this.logger.log(`Deleting fact for uid: ${uid}`);
    return this.webSocketClient.deleteFact(uid);
  }

  async getClassified(uid: number) {
    this.logger.log(`Getting classified for uid: ${uid}`);
    return this.webSocketClient.getClassified(uid);
  }

  async getClassificationFact(uid: number) {
    this.logger.log(`Getting classification fact for uid: ${uid}`);
    return this.webSocketClient.getClassificationFact(uid);
  }

  async submitDefinition(
    fact_uid: number,
    partial_definition: string,
    full_definition: string,
  ) {
    this.logger.log(`Submitting definition for fact_uid: ${fact_uid}`);
    return this.webSocketClient.submitDefinition(fact_uid, partial_definition, full_definition);
  }

  async submitCollection(
    fact_uid: number,
    collection_uid: number,
    collection_name: string,
  ) {
    this.logger.log(`Submitting collection for fact_uid: ${fact_uid}`);
    return this.webSocketClient.submitCollection(fact_uid, collection_uid, collection_name);
  }

  async submitName(fact_uid: number, name: string) {
    this.logger.log(`Submitting name for fact_uid: ${fact_uid}`);
    return this.webSocketClient.submitName(fact_uid, name);
  }
}
