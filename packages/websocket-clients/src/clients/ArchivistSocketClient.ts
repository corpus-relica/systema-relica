import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseWebSocketClient } from "./BaseWebSocketClient";
import {
  FactActions,
  SearchActions,
  ConceptActions,
  SubmissionActions,
  DefinitionActions,
  KindActions,
  EntityActions,
  QueryActions,
  UIDActions,
  CompletionActions,
  TransactionActions,
  ValidationActions,
  SpecializationActions,
  LineageActions,
} from "@relica/websocket-contracts";

@Injectable()
export class ArchivistSocketClient extends BaseWebSocketClient {
  constructor(configService: ConfigService) {
    super(configService, "archivist", 3002);
  }

  // =====================================================
  // FACT OPERATIONS
  // =====================================================

  async getFact(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(FactActions.GET, payload);
  }

  async getFacts(factUIDs: number[]): Promise<any> {
    // For multiple facts, make multiple calls or use batch operation
    const promises = factUIDs.map((uid) => this.getFact(uid));
    return Promise.all(promises);
  }

  async createFact(fact: any): Promise<any> {
    return this.sendRequestMessage(FactActions.CREATE, fact);
  }

  async deleteFact(factUid: number): Promise<any> {
    const payload = { fact_uid: factUid };
    return this.sendRequestMessage(FactActions.DELETE, payload);
  }

  async getSubtypes(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(FactActions.GET_SUBTYPES, payload);
  }

  async getSubtypesCone(uid: number): Promise<any> {
    const payload = { uid, includeSubtypes: true };
    return this.sendRequestMessage(FactActions.GET_SUBTYPES_CONE, payload);
  }

  async getSupertypes(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(FactActions.GET_SUPERTYPES, payload);
  }

  async getSpecializationHierarchy(
    uidOrUserId: number,
    uid?: number
  ): Promise<any> {
    // Support both signatures:
    // getSpecializationHierarchy(uid: number) - original
    // getSpecializationHierarchy(userId: number, uid: number) - Aperture style
    if (uid !== undefined) {
      // Aperture-style call with userId
      const payload = { uid, userId: uidOrUserId };
      return this.sendRequestMessage(
        SpecializationActions.SPECIALIZATION_HIERARCHY_GET,
        payload
      );
    } else {
      // Original style call with just uid
      const payload = { uid: uidOrUserId };
      return this.sendRequestMessage(FactActions.GET_SUPERTYPES, payload);
    }
  }

  async getSpecializationFact(userId: number, uid: number): Promise<any> {
    const payload = { uid, userId };
    return this.sendRequestMessage(
      SpecializationActions.SPECIALIZATION_FACT_GET,
      payload
    );
  }

  async getClassified(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(FactActions.GET_CLASSIFIED, payload);
  }

  async getClassificationFact(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(FactActions.GET_CLASSIFIED, payload);
  }

  async retrieveAllFacts(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(FactActions.GET_ALL_RELATED, payload);
  }

  async getDefinitiveFacts(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(FactActions.GET_DEFINITIVE, payload);
  }

  async getFactsRelatingEntities(uid1: number, uid2: number): Promise<any> {
    const payload = { query: `relating:${uid1}:${uid2}` };
    return this.sendRequestMessage(QueryActions.EXECUTE, payload);
  }

  async createKind(
    parentUID: number,
    parentName: string,
    name: string,
    definition: string
  ): Promise<any> {
    const payload = {
      lh_object_uid: 1, // temporary UID will be assigned by system
      rh_object_uid: parentUID,
      rel_type_uid: 1146, // specialization relationship
      lh_object_name: name,
      rh_object_name: parentName,
      rel_type_name: "is a specialization of",
      full_definition: definition,
    };
    return this.sendRequestMessage(FactActions.CREATE, payload);
  }

  async createIndividual(
    kindUID: number,
    kindName: string,
    name: string,
    definition: string
  ): Promise<any> {
    const payload = {
      lh_object_uid: 1, // temporary UID will be assigned by system
      rh_object_uid: kindUID,
      rel_type_uid: 1225, // classification relationship
      lh_object_name: name,
      rh_object_name: kindName,
      rel_type_name: "is classified as a",
      full_definition: definition,
    };
    return this.sendRequestMessage(FactActions.CREATE, payload);
  }

  // =====================================================
  // ENTITY OPERATIONS
  // =====================================================

  async getEntity(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(ConceptActions.GET, payload);
  }

  async getCategory(uid: number): Promise<any> {
    const payload = { uid };
    console.log(
      "Fetching category for entity UID:",
      EntityActions.CATEGORY_GET,
      uid
    );
    return this.sendRequestMessage(EntityActions.CATEGORY_GET, payload);
  }

  async getEntityType(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(EntityActions.TYPE_GET, payload);
  }

  async getEntityCategory(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(EntityActions.CATEGORY_GET, payload);
  }

  async deleteEntity(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(ConceptActions.DELETE, payload);
  }

  async resolveUIDs(uids: number[]): Promise<any> {
    const payload = { uids };
    return this.sendRequestMessage(EntityActions.BATCH_RESOLVE, payload);
  }

  async getEntityCollections(): Promise<any> {
    const payload = {};
    return this.sendRequestMessage(EntityActions.COLLECTIONS_GET, payload);
  }

  // =====================================================
  // KIND OPERATIONS
  // =====================================================

  async getKinds(): Promise<any> {
    const payload = {};
    return this.sendRequestMessage(KindActions.LIST, payload);
  }

  async getKindsList(
    sortField: string = "lh_object_name",
    sortOrder: string = "ASC",
    skip: number = 0,
    pageSize: number = 10,
    filters: any = {}
  ): Promise<any> {
    console.log(
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Fetching kinds with filters:",
      { sortField, sortOrder, skip, pageSize, filters }
    );
    const payload = {
      filters: {
        sort: [sortField, sortOrder],
        range: [skip, pageSize],
        filter: filters,
      },
    };
    console.log("#####", payload);
    return this.sendRequestMessage(KindActions.LIST, payload);
  }

  // =====================================================
  // SEARCH OPERATIONS
  // =====================================================

  async searchText(
    query: string,
    collectionUID?: number,
    limit?: number,
    offset?: number,
    searchFilter?: string
  ): Promise<any> {
    // Convert offset to page number (1-based)
    const page = offset ? Math.floor(offset / (limit || 20)) + 1 : 1;

    const payload = {
      searchTerm: query,
      collectionUID,
      page,
      pageSize: limit || 20,
      filter: searchFilter,
    };
    return this.sendRequestMessage(SearchActions.GENERAL, payload);
  }

  async textSearch(searchTerm: string, exactMatch?: boolean): Promise<any> {
    const payload = {
      searchTerm: searchTerm,
      filter: { exactMatch: exactMatch },
    };
    return this.sendRequestMessage(SearchActions.GENERAL, payload);
  }

  async textSearchExact(searchTerm: string): Promise<any> {
    const payload = {
      searchTerm: searchTerm,
      filter: { exactMatch: true },
    };
    return this.sendRequestMessage(SearchActions.GENERAL, payload);
  }

  async searchUid(uid: string): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(SearchActions.UID, payload);
  }

  async uidSearch(params: { searchUID: number }): Promise<any> {
    return this.sendRequestMessage(SearchActions.UID, params);
  }

  // =====================================================
  // SUBMISSION OPERATIONS
  // =====================================================

  async submitFact(factData: any): Promise<any> {
    return this.sendRequestMessage(SubmissionActions.SUBMIT, {
      facts: [factData],
    });
  }

  async submitDefinition(
    fact_uid: number,
    partial_definition: string,
    full_definition: string
  ): Promise<any> {
    const payload = {
      uid: fact_uid,
      definition: {
        partial_definition,
        full_definition,
      },
    };
    return this.sendRequestMessage(DefinitionActions.UPDATE, payload);
  }

  async submitCollection(
    fact_uid: number,
    collection_uid: number,
    collection_name: string
  ): Promise<any> {
    const payload = {
      facts: [
        {
          lh_object_uid: fact_uid,
          rh_object_uid: collection_uid,
          rel_type_uid: 1, // Placeholder - would need appropriate relation type
          collection_name,
        },
      ],
      metadata: { type: "collection_update" },
    };
    return this.sendRequestMessage(SubmissionActions.SUBMIT, payload);
  }

  async submitName(fact_uid: number, name: string): Promise<any> {
    const payload = {
      facts: [
        {
          lh_object_uid: fact_uid,
          rh_object_uid: 1, // Placeholder - entity being named
          rel_type_uid: 1, // Placeholder - would need appropriate relation type
          name,
        },
      ],
      metadata: { type: "name_update" },
    };
    return this.sendRequestMessage(SubmissionActions.SUBMIT, payload);
  }

  // =====================================================
  // SPECIALIZED OPERATIONS (from Aperture implementation)
  // =====================================================

  async getAllRelated(uid: number): Promise<any> {
    const payload = { uid };
    return this.sendRequestMessage(FactActions.GET_ALL_RELATED, payload);
  }

  async getRecursiveRelations(
    entityUid: number,
    relTypeUid: number
  ): Promise<any> {
    const payload = { query: `recursive:${entityUid}:${relTypeUid}` };
    return this.sendRequestMessage(QueryActions.EXECUTE, payload);
  }

  async getRecursiveRelationsTo(
    entityUid: number,
    relTypeUid: number
  ): Promise<any> {
    const payload = { query: `recursiveTo:${entityUid}:${relTypeUid}` };
    return this.sendRequestMessage(QueryActions.EXECUTE, payload);
  }

  async getRequiredRoles(relTypeUid: number): Promise<any> {
    const payload = { query: `requiredRoles:${relTypeUid}` };
    return this.sendRequestMessage(QueryActions.EXECUTE, payload);
  }

  async getRolePlayers(relTypeUid: number): Promise<any> {
    const payload = { query: `rolePlayers:${relTypeUid}` };
    return this.sendRequestMessage(QueryActions.EXECUTE, payload);
  }

  async getRelatedOnUIDSubtypeCone(
    lh_object_uid: number,
    rel_type_uid: number
  ): Promise<any> {
    const payload = {
      uid: lh_object_uid,
      includeSubtypes: true,
      maxDepth: 10, // reasonable default for cone searches
    };
    return this.sendRequestMessage(FactActions.GET, payload);
  }

  // Connection utilities inherited from BaseWebSocketClient

  async getFactsBatch(config: {
    skip: number;
    range: number;
    relTypeUids?: number[];
  }): Promise<any> {
    return this.sendRequestMessage(FactActions.BATCH_GET, config);
  }

  async getEntityLineageViaEndpoint(entityUid: number): Promise<any> {
    return this.sendRequestMessage(LineageActions.GET, { uid: entityUid });
  }
}
