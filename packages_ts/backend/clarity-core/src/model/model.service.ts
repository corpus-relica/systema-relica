import { Injectable, Logger } from '@nestjs/common';
import { Fact } from '@relica/types';

import { ArchivistService } from '../archivist/archivist.service.js';

const physObjUID = 730044;
const aspectUID = 790229;
const roleUID = 160170;
const relationUID = 2850;
const occurrenceUID = 193671;

const PHYSICAL_OBJECT = 'physical object';
const ASPECT = 'aspect';
const ROLE = 'role';
const RELATION = 'relation';
const OCCURRENCE = 'occurrence';

@Injectable()
export class ModelService {
  private readonly logger = new Logger(ModelService.name);

  constructor(private readonly archivistService: ArchivistService) {}

  async getPhysicalObjectModel(uid) {
    return { aspects: [], roles: [], components: [], connections: [] };
  }

  async getAspectModel(uid) {
    return { possessors: [] };
  }

  async getRoleModel(uid) {
    return { rolePlayers: [] };
  }

  async getRelationModel(uid) {
    return { rolePlayer1: null, rolePlayer2: null };
  }

  async getOccurrenceModel(uid) {
    return { aspects: [], involved: [] };
  }

  async retrieveKindModel(uid, token) {
    console.log('RETREIVE MODEL uid', uid);
    const category = await this.archivistService.getCategory(uid, token);
    console.log('category', category);
    const facts = await this.archivistService.retrieveAllFacts(uid, token);
    // console.log('facts', facts);
    const definitiveFacts = await this.archivistService.getDefinitiveFacts(
      uid,
      token,
    );
    // console.log('definitiveFacts', definitiveFacts);
    const specialization =
      await this.archivistService.getRelatedOnUIDSubtypeCone(uid, 1146, token);
    // console.log('specialization', specialization);
    const classification =
      await this.archivistService.getRelatedOnUIDSubtypeCone(uid, 1225, token);
    // console.log("classification", classification);
    const synonyms = await this.archivistService.getRelatedOnUIDSubtypeCone(
      uid,
      1981,
      token,
    );
    // console.log("synonyms", synonyms);
    const inverses = await this.archivistService.getRelatedOnUIDSubtypeCone(
      uid,
      1986,
      token,
    );
    // console.log("inverses", inverses);
    const reqRole1 = await this.archivistService.getRelatedOnUIDSubtypeCone(
      uid,
      4731,
      token,
    );
    // console.log("reqRole1", reqRole1);
    const reqRole2 = await this.archivistService.getRelatedOnUIDSubtypeCone(
      uid,
      4733,
      token,
    );
    // console.log("reqRole2", reqRole2);
    const possRoles = await this.archivistService.getRelatedOnUIDSubtypeCone(
      uid,
      4714,
      token,
    );
    // console.log("possRoles", possRoles);
    let model;
    switch (category) {
      case PHYSICAL_OBJECT:
        model = await this.getPhysicalObjectModel(uid);
        break;
      case ASPECT:
        model = await this.getAspectModel(uid);
        break;
      case ROLE:
        model = await this.getRoleModel(uid);
        break;
      case RELATION:
        model = await this.getRelationModel(uid);
        break;
      case OCCURRENCE:
        model = await this.getOccurrenceModel(uid);
        break;
      default:
        model = {};
        break;
    }

    // console.log(definitiveFacts);
    return Object.assign(model, {
      uid: uid,
      collection: {
        uid: definitiveFacts[0].collection_uid,
        name: definitiveFacts[0].collection_name,
      },
      name: definitiveFacts[0].lh_object_name, //.map((x: Fact)  x.lh_object_name).join(", "),
      type: 'kind',
      category: category,
      definition: definitiveFacts.map((x) => ({
        fact_uid: x.fact_uid,
        partial_definition: x.partial_definition,
        full_definition: x.full_definition,
      })),
      facts: facts,
      //
      1146: specialization.map((x) => x.rh_object_uid),
      1225: classification.map((x) => x.rh_object_uid),
      1981: synonyms.map((x) => x.lh_object_name),
      1986: inverses.map((x) => x.lh_object_name),
      4731: reqRole1.map((x) => x.rh_object_uid),
      4733: reqRole2.map((x) => x.rh_object_uid),
      4714: possRoles.map((x) => x.rh_object_uid),
    });
  }

  async retrieveIndividualModel(uid: number, token: string) {
    const category = await this.archivistService.getCategory(uid, token);
    const facts = await this.archivistService.retrieveAllFacts(uid, token);
    const definitiveFacts = await this.archivistService.getDefinitiveFacts(
      uid,
      token,
    );
    const classification =
      await this.archivistService.getRelatedOnUIDSubtypeCone(uid, 1225, token);
    // // const synonyms = await getRelatedOnUIDSubtypeCone(uid, 1981);
    // // const inverses = await getRelatedOnUIDSubtypeCone(uid, 1986);
    // // const reqRole1 = await getRelatedOnUIDSubtypeCone(uid, 4731);
    // // const reqRole2 = await getRelatedOnUIDSubtypeCone(uid, 4733);
    // // const possRoles = await getRelatedOnUIDSubtypeCone(uid, 4714);
    if (classification.length === 0) {
      return null;
    }
    const baseObj = {
      uid: uid,
      name: classification[0].lh_object_name,
      collection: {
        uid: definitiveFacts[0].collection_uid,
        name: definitiveFacts[0].collection_name,
      },
      1225: classification.map((x) => x.rh_object_uid),
      type: 'individual',
      category: category,
      definition: definitiveFacts.map((x) => ({
        fact_uid: x.fact_uid,
        partial_definition: x.partial_definition,
        full_definition: x.full_definition,
      })),
      facts,
    };
    const value = await this.archivistService.getRelatedOnUIDSubtypeCone(
      uid,
      5025,
      token,
    ); // 'has on scale a value equal to'
    if (value.length > 0) {
      const valFact = value[0];
      const val = parseInt(valFact.rh_object_name);
      const uom = { uid: valFact.uom_uid, name: valFact.uom_name };
      return { ...baseObj, value: { quant: val, uom } };
    }
    return baseObj;
  }

  async retrieveQualificationModel(uid: number, token: string) {
    const category = await this.archivistService.getCategory(uid, token);
    const facts = await this.archivistService.retrieveAllFacts(uid, token);
    const definitiveFacts = await this.archivistService.getDefinitiveFacts(
      uid,
      token,
    );
    const baseObj = {
      name: definitiveFacts[0].lh_object_name,
      uid: uid,
      type: 'qualification',
      category: category,
      facts,
    };
    return baseObj;
  }

  async retrieveModel(uid: number, token: string) {
    const type = await this.archivistService.getEntityType(uid, token);

    console.log('type', type);

    if (type === 'kind') {
      return this.retrieveKindModel(uid, token);
    } else if (type === 'individual') {
      return this.retrieveIndividualModel(uid, token);
    } else if (type === 'qualification') {
      return this.retrieveQualificationModel(uid, token);
    } else if (uid === 730000) {
      return {
        uid: uid,
        name: 'anything',
        type: 'kind',
        category: 'anything',
        definition: 'is an anything',
        facts: [],
        1146: [],
        1225: [],
        1981: [],
        1986: [],
        4731: [],
        4733: [],
        4714: [],
      };
    } else {
      console.log(
        '//// ERROR: modelController.retrieveModel: unknown type uid',
        uid,
      );
      return null;
    }
  }

  async throttlePromises(funcs, limit) {
    let results = [];
    let executing = [];
    for (const func of funcs) {
      const p = Promise.resolve().then(func);
      results.push(p);
      if (limit <= funcs.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= limit) {
          await Promise.race(executing);
        }
      }
    }
    return Promise.all(results);
  }

  async retrieveModels(uids: number[], token) {
    const funcs = uids.map((uid) => () => this.retrieveModel(uid, token));
    return await this.throttlePromises(funcs, 5);
  }

  async updateDefinition(fact_uid, partial_definition, full_definition) {
    const response = await this.archivistService.submitDefinition(
      fact_uid,
      partial_definition,
      full_definition,
    );
    return response;
  }

  async updateCollection(fact_uid, collection_uid, collection_name) {
    const response = await this.archivistService.submitCollection(
      fact_uid,
      collection_uid,
      collection_name,
    );
    return response;
  }

  async updateName(uid, name) {
    // fact_uid, (the definitive fact uid)
    // new_name
    const response = await this.archivistService.submitName(uid, name);
    return response;
  }
}
