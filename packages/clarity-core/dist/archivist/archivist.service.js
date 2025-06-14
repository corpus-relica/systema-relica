"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ArchivistService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchivistService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const constants_1 = require("./constants");
const URL = process.env.ARCHIVIST_URL || 'http://localhost:3000';
let ArchivistService = ArchivistService_1 = class ArchivistService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(ArchivistService_1.name);
    }
    async getSpecializationHierarchy(uid) {
        const url = `${URL}${constants_1.SPECIALIZATION_HIERARCHY_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid } }));
        return data;
    }
    async getSpecializationFact(uid) {
        const url = `${URL}${constants_1.SPECIALIZATION_FACT_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid } }));
        return data;
    }
    async getSubtypes(uid) {
        const url = `${URL}${constants_1.SUBTYPES_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid } }));
        return data;
    }
    async getSubtypesCone(uid) {
        const url = `${URL}${constants_1.SUBTYPES_CONE_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid } }));
        return data;
    }
    async getFact(uid) {
        const url = `${URL}${constants_1.FACT_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid } }));
        return data;
    }
    async getFacts(factUIDs) {
        const url = `${URL}${constants_1.FACTS_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uids: JSON.stringify(factUIDs) } }));
        return data;
    }
    async getEntity(uid) {
        const url = `${URL}${constants_1.ENTITY_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid } }));
        return data;
    }
    async retrieveAllFacts(uid) {
        const url = `${URL}${constants_1.ALL_RELATED_FACTS_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid } }));
        return data;
    }
    async getCategory(uid) {
        const url = `${URL}${constants_1.ENTITY_CATEGORY_ENDPOINT}`;
        console.log('\\\\\\\\\\\\\\\\\\ url \\\\\\\\\\\\\\\\\\\\\\\\', url);
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid } }));
        return data;
    }
    async getDefinitiveFacts(uid) {
        const url = `${URL}${constants_1.DEFINITIVE_FACTS_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid } }));
        return data;
    }
    async getRelatedOnUIDSubtypeCone(lh_object_uid, rel_type_uid) {
        const url = `${URL}${constants_1.RELATED_ON_SUBTYPE_CONE_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { lh_object_uid, rel_type_uid } }));
        return data;
    }
    async getEntityType(uid) {
        const url = `${URL}${constants_1.ENTITY_TYPE_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid } }));
        return data;
    }
    async getFactsRelatingEntities(uid1, uid2) {
        const url = `${URL}${constants_1.FACTS_RELATING_ENTITIES_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid1, uid2 } }));
        return data;
    }
    async textSearchExact(searchTerm) {
        const url = `${URL}${constants_1.TEXT_SEARCH_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { searchTerm, exactMatch: true } }));
        console.log('TEXT SEARCH EXACT: ', data);
        return data;
    }
    async createKind(parentUID, parentName, name, definition) {
        const url = `${URL}${constants_1.SUBMIT_BINARY_FACT_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, {
            lh_object_uid: '1',
            lh_object_name: name,
            rel_type_uid: 1146,
            rel_type_name: 'is a specialization of',
            rh_object_uid: parentUID,
            rh_object_name: parentName,
            full_definition: definition,
        }));
        return data;
    }
    async createIndividual(kindUID, kindName, name, definition) {
        const url = `${URL}${constants_1.SUBMIT_BINARY_FACT_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, {
            lh_object_uid: '1',
            lh_object_name: name,
            rel_type_uid: 1225,
            rel_type_name: 'is classified as a',
            rh_object_uid: kindUID,
            rh_object_name: kindName,
            full_definition: definition,
        }));
        return data;
    }
    async deleteEntity(uid) {
        const url = `${URL}${constants_1.DELETE_ENTITY_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.delete(url, { params: { uid } }));
        return data;
    }
    async deleteFact(uid) {
        const url = `${URL}${constants_1.DELETE_FACT_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.delete(url, { params: { uid } }));
        return data;
    }
    async getClassified(uid) {
        const url = `${URL}${constants_1.CLASSIFIED_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid } }));
        return data;
    }
    async getClassificationFact(uid) {
        const url = `${URL}${constants_1.CLASSIFICATION_FACT_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params: { uid } }));
        return data;
    }
    async submitDefinition(fact_uid, partial_definition, full_definition) {
        const url = `${URL}${constants_1.SUBMIT_DEFINITION_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.put(url, {
            fact_uid,
            partial_definition,
            full_definition,
        }));
        return data;
    }
    async submitCollection(fact_uid, collection_uid, collection_name) {
        const url = `${URL}${constants_1.SUBMIT_COLLECTION_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.put(url, {
            fact_uid,
            collection_uid,
            collection_name,
        }));
        return data;
    }
    async submitName(fact_uid, name) {
        const url = `${URL}${constants_1.SUBMIT_NAME_ENDPOINT}`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.put(url, {
            fact_uid,
            name,
        }));
        return data;
    }
};
exports.ArchivistService = ArchivistService;
exports.ArchivistService = ArchivistService = ArchivistService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], ArchivistService);
//# sourceMappingURL=archivist.service.js.map