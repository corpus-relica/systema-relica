import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import {
  SUBMIT_DEFINITION_ENDPOINT,
  SUBMIT_COLLECTION_ENDPOINT,
  SUBMIT_NAME_ENDPOINT,
  DELETE_ENTITY_ENDPOINT,
  DELETE_FACT_ENDPOINT,
  SPECIALIZATION_HIERARCHY_ENDPOINT,
  SPECIALIZATION_FACT_ENDPOINT,
  SUBTYPES_ENDPOINT,
  SUBTYPES_CONE_ENDPOINT,
  FACT_ENDPOINT,
  FACTS_ENDPOINT,
  ENTITY_ENDPOINT,
  ENTITY_CATEGORY_ENDPOINT,
  ALL_RELATED_FACTS_ENDPOINT,
  DEFINITIVE_FACTS_ENDPOINT,
  RELATED_ON_SUBTYPE_CONE_ENDPOINT,
  ENTITY_TYPE_ENDPOINT,
  FACTS_RELATING_ENTITIES_ENDPOINT,
  TEXT_SEARCH_ENDPOINT,
  SUBMIT_BINARY_FACT_ENDPOINT,
  CLASSIFIED_ENDPOINT,
  CLASSIFICATION_FACT_ENDPOINT,
} from './constants';

const URL = process.env.ARCHIVIST_URL || 'http://localhost:3000';

@Injectable()
export class ArchivistService {
  private readonly logger = new Logger(ArchivistService.name);

  constructor(private httpService: HttpService) {}

  async getSpecializationHierarchy(uid: number) {
    const url = `${URL}${SPECIALIZATION_HIERARCHY_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid } }),
    );
    return data;
  }

  async getSpecializationFact(uid: number) {
    const url = `${URL}${SPECIALIZATION_FACT_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid } }),
    );
    return data;
  }

  async getSubtypes(uid: number) {
    const url = `${URL}${SUBTYPES_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid } }),
    );
    return data;
  }

  async getSubtypesCone(uid: number) {
    const url = `${URL}${SUBTYPES_CONE_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid } }),
    );
    return data;
  }

  async getFact(uid: number) {
    const url = `${URL}${FACT_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid } }),
    );
    return data;
  }

  async getFacts(factUIDs: number[]) {
    const url = `${URL}${FACTS_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uids: JSON.stringify(factUIDs) } }),
    );
    return data;
  }

  async getEntity(uid: number) {
    const url = `${URL}${ENTITY_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid } }),
    );
    return data;
  }

  async retrieveAllFacts(uid: number) {
    const url = `${URL}${ALL_RELATED_FACTS_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid } }),
    );
    return data;
  }

  async getCategory(uid: number) {
    const url = `${URL}${ENTITY_CATEGORY_ENDPOINT}`;
    console.log('\\\\\\\\\\\\\\\\\\ url \\\\\\\\\\\\\\\\\\\\\\\\', url);
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid } }),
    );
    return data;
  }

  async getDefinitiveFacts(uid: number) {
    const url = `${URL}${DEFINITIVE_FACTS_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid } }),
    );
    return data;
  }

  async getRelatedOnUIDSubtypeCone(
    lh_object_uid: number,
    rel_type_uid: number,
  ) {
    const url = `${URL}${RELATED_ON_SUBTYPE_CONE_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { lh_object_uid, rel_type_uid } }),
    );
    return data;
  }

  async getEntityType(uid: number) {
    const url = `${URL}${ENTITY_TYPE_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid } }),
    );
    return data;
  }

  async getFactsRelatingEntities(uid1: number, uid2: number) {
    const url = `${URL}${FACTS_RELATING_ENTITIES_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid1, uid2 } }),
    );
    return data;
  }

  async textSearchExact(searchTerm: string) {
    const url = `${URL}${TEXT_SEARCH_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { searchTerm, exactMatch: true } }),
    );
    console.log('TEXT SEARCH EXACT: ', data);
    return data;
  }

  async createKind(
    parentUID: number,
    parentName: string,
    name: string,
    definition: string,
  ) {
    const url = `${URL}${SUBMIT_BINARY_FACT_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.post(url, {
        lh_object_uid: '1',
        lh_object_name: name,
        rel_type_uid: 1146,
        rel_type_name: 'is a specialization of',
        rh_object_uid: parentUID,
        rh_object_name: parentName,
        full_definition: definition,
      }),
    );
    return data;
  }

  async createIndividual(
    kindUID: number,
    kindName: string,
    name: string,
    definition: string,
  ) {
    const url = `${URL}${SUBMIT_BINARY_FACT_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.post(url, {
        lh_object_uid: '1',
        lh_object_name: name,
        rel_type_uid: 1225,
        rel_type_name: 'is classified as a',
        rh_object_uid: kindUID,
        rh_object_name: kindName,
        full_definition: definition,
      }),
    );
    return data;
  }

  async deleteEntity(uid: number) {
    const url = `${URL}${DELETE_ENTITY_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.delete(url, { params: { uid } }),
    );
    return data;
  }

  async deleteFact(uid: number) {
    const url = `${URL}${DELETE_FACT_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.delete(url, { params: { uid } }),
    );
    return data;
  }

  async getClassified(uid: number) {
    const url = `${URL}${CLASSIFIED_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid } }),
    );
    return data;
  }

  async getClassificationFact(uid: number) {
    const url = `${URL}${CLASSIFICATION_FACT_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { params: { uid } }),
    );
    return data;
  }

  async submitDefinition(
    fact_uid: number,
    partial_definition: string,
    full_definition: string,
  ) {
    const url = `${URL}${SUBMIT_DEFINITION_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.put(url, {
        fact_uid,
        partial_definition,
        full_definition,
      }),
    );
    return data;
  }

  async submitCollection(
    fact_uid: number,
    collection_uid: number,
    collection_name: string,
  ) {
    const url = `${URL}${SUBMIT_COLLECTION_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.put(url, {
        fact_uid,
        collection_uid,
        collection_name,
      }),
    );
    return data;
  }

  async submitName(fact_uid: number, name: string) {
    const url = `${URL}${SUBMIT_NAME_ENDPOINT}`;
    const { data } = await firstValueFrom(
      this.httpService.put(url, {
        fact_uid,
        name,
      }),
    );
    return data;
  }
}
