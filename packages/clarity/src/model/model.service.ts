import { Injectable, Logger } from '@nestjs/common';
import { Fact } from '@relica/types';

import { ArchivistService } from 'src/archivist/archivist.service';

// Quintessential Model Category UIDs
const physObjUID = 730044;
const aspectUID = 790229;
const roleUID = 160170;
const relationUID = 2850;
const occurrenceUID = 193671;

// Category Names
const PHYSICAL_OBJECT = 'physical object';
const ASPECT = 'aspect';
const ROLE = 'role';
const RELATION = 'relation';
const OCCURRENCE = 'occurrence';

// Semantic Relationship UIDs (matching Clojure implementation)
const RELATION_UID_TO_SEMANTIC = {
  1146: 'specialization-of',
  1225: 'classification',
  1981: 'synonym',
  1986: 'inverse',
  4731: 'required-role-1',
  4733: 'required-role-2',
  5025: 'value',
  5644: 'involves',
  4714: 'possible-role',
} as const;

// Entity Natures
const NATURE_KIND = 'kind';
const NATURE_INDIVIDUAL = 'individual';
const NATURE_QUALIFICATION = 'qualification';

@Injectable()
export class ModelService {
  private readonly logger = new Logger(ModelService.name);

  constructor(private readonly archivistService: ArchivistService) {}

  async getPhysicalObjectModel(uid: number) {
    // Get all facts related to this physical object
    const facts = await this.archivistService.retrieveAllFacts(uid);
    console.log(
      'FFFFFFFFFFFAAAAAAAAAAAAAAAAAAAAAAAAAAAACCCCCCCCCCCCCTTTTTTTTTTSSSSSS __ PO',
      facts,
    );
    const definitiveFacts = await this.archivistService.getDefinitiveFacts(uid);

    // Get aspects (things this physical object has)
    const aspects = facts
      .filter((f) => f.rel_type_name?.includes('has aspect'))
      .map((f) => ({
        uid: f.rh_object_uid,
        name: f.rh_object_name,
        relation_uid: f.rel_type_uid,
      }));

    // Get roles (roles this physical object can play)
    const roles = facts
      .filter((f) => f.rel_type_name?.includes('plays role'))
      .map((f) => ({
        uid: f.rh_object_uid,
        name: f.rh_object_name,
        relation_uid: f.rel_type_uid,
      }));

    // Get parts/components (things this object is composed of)
    const components = facts
      .filter((f) => f.rel_type_name?.includes('part of'))
      .map((f) => ({
        uid: f.lh_object_uid,
        name: f.lh_object_name,
        relation_uid: f.rel_type_uid,
      }));

    // Get connections (other objects this is connected to)
    const connections = facts
      .filter((f) => f.rel_type_name?.includes('connected'))
      .map((f) => ({
        uid: f.rh_object_uid,
        name: f.rh_object_name,
        relation_uid: f.rel_type_uid,
      }));

    return {
      uid,
      category: PHYSICAL_OBJECT,
      name: definitiveFacts[0]?.lh_object_name,
      aspects,
      roles,
      components,
      connections,
      facts,
    };
  }

  async getAspectModel(uid: number) {
    const facts = await this.archivistService.retrieveAllFacts(uid);
    const definitiveFacts = await this.archivistService.getDefinitiveFacts(uid);

    console.log(
      'FFFFFFFFFFFAAAAAAAAAAAAAAAAAAAAAAAAAAAACCCCCCCCCCCCCTTTTTTTTTTSSSSSS __ ASP',
      facts,
    );
    // Get possessors (entities that have this aspect)
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
    const unitOfMeasure = facts.find((f) =>
      f.rel_type_name?.includes('unit of measure'),
    );

    return {
      uid,
      category: ASPECT,
      name: definitiveFacts[0]?.lh_object_name,
      possessors,
      isQuantitative,
      unitOfMeasure: unitOfMeasure
        ? {
            uid: unitOfMeasure.rh_object_uid,
            name: unitOfMeasure.rh_object_name,
          }
        : null,
      facts,
    };
  }

  async getRoleModel(uid: number) {
    const facts = await this.archivistService.retrieveAllFacts(uid);
    const definitiveFacts = await this.archivistService.getDefinitiveFacts(uid);

    console.log(
      'FFFFFFFFFFFAAAAAAAAAAAAAAAAAAAAAAAAAAAACCCCCCCCCCCCCTTTTTTTTTTSSSSSS __ ROLE',
      facts,
    );
    // Get role players (entities that can play this role)
    const rolePlayers = facts
      .filter((f) => f.rel_type_name?.includes('plays role'))
      .map((f) => ({
        uid: f.lh_object_uid,
        name: f.lh_object_name,
        relation_uid: f.rel_type_uid,
      }));

    // Get required relations (relations that require this role)
    const requiredInRelations = facts
      .filter((f) => f.rel_type_uid === 4731 || f.rel_type_uid === 4733)
      .map((f) => ({
        uid: f.lh_object_uid,
        name: f.lh_object_name,
        role_position: f.rel_type_uid === 4731 ? 1 : 2,
      }));

    return {
      uid,
      category: ROLE,
      name: definitiveFacts[0]?.lh_object_name,
      rolePlayers,
      requiredInRelations,
      facts,
    };
  }

  async getRelationModel(uid: number) {
    const facts = await this.archivistService.retrieveAllFacts(uid);
    const definitiveFacts = await this.archivistService.getDefinitiveFacts(uid);
    console.log(
      'FFFFFFFFFFFAAAAAAAAAAAAAAAAAAAAAAAAAAAACCCCCCCCCCCCCTTTTTTTTTTSSSSSS __ RELATION',
      facts,
    );

    // Get required roles for this relation
    const requiredRole1 = facts.find((f) => f.rel_type_uid === 4731);
    const requiredRole2 = facts.find((f) => f.rel_type_uid === 4733);

    // Get inverse relation if any
    const inverseRelation = facts.find((f) => f.rel_type_uid === 1986);

    return {
      uid,
      category: RELATION,
      name: definitiveFacts[0]?.lh_object_name,
      requiredRole1: requiredRole1
        ? {
            uid: requiredRole1.rh_object_uid,
            name: requiredRole1.rh_object_name,
          }
        : null,
      requiredRole2: requiredRole2
        ? {
            uid: requiredRole2.rh_object_uid,
            name: requiredRole2.rh_object_name,
          }
        : null,
      inverseRelation: inverseRelation
        ? {
            uid: inverseRelation.rh_object_uid,
            name: inverseRelation.rh_object_name,
          }
        : null,
      facts,
    };
  }

  async getOccurrenceModel(uid: number) {
    const facts = await this.archivistService.retrieveAllFacts(uid);
    const definitiveFacts = await this.archivistService.getDefinitiveFacts(uid);

    console.log(
      'FFFFFFFFFFFAAAAAAAAAAAAAAAAAAAAAAAAAAAACCCCCCCCCCCCCTTTTTTTTTTSSSSSS __ OCCUR',
      facts,
    );
    // Get aspects of this occurrence
    const aspects = facts
      .filter((f) => f.rel_type_name?.includes('has aspect'))
      .map((f) => ({
        uid: f.rh_object_uid,
        name: f.rh_object_name,
        relation_uid: f.rel_type_uid,
      }));

    // Get involved entities (things involved in this occurrence)
    const involved = facts
      .filter((f) => f.rel_type_uid === 5644)
      .map((f) => ({
        uid: f.rh_object_uid,
        name: f.rh_object_name,
        relation_uid: f.rel_type_uid,
      }));

    // Get temporal aspects (begin time, end time, duration)
    const beginTime = facts.find((f) =>
      f.rel_type_name?.includes('begin time'),
    );
    const endTime = facts.find((f) => f.rel_type_name?.includes('end time'));
    const duration = facts.find((f) => f.rel_type_name?.includes('duration'));

    return {
      uid,
      category: OCCURRENCE,
      name: definitiveFacts[0]?.lh_object_name,
      aspects,
      involved,
      temporalAspects: {
        beginTime: beginTime
          ? {
              uid: beginTime.rh_object_uid,
              name: beginTime.rh_object_name,
              value: beginTime.full_definition,
            }
          : null,
        endTime: endTime
          ? {
              uid: endTime.rh_object_uid,
              name: endTime.rh_object_name,
              value: endTime.full_definition,
            }
          : null,
        duration: duration
          ? {
              uid: duration.rh_object_uid,
              name: duration.rh_object_name,
              value: duration.full_definition,
            }
          : null,
      },
      facts,
    };
  }

  async retrieveKindModel(uid) {
    console.log('RETREIVE MODEL uid', uid);
    const category = await this.archivistService.getCategory(uid);
    console.log('category', category);
    const facts = await this.archivistService.retrieveAllFacts(uid);
    console.log('facts', facts);
    const definitiveFacts = await this.archivistService.getDefinitiveFacts(uid);
    console.log('definitiveFacts', definitiveFacts);
    const specialization =
      await this.archivistService.getRelatedOnUIDSubtypeCone(uid, 1146);
    console.log('specialization', specialization);
    const classification =
      await this.archivistService.getRelatedOnUIDSubtypeCone(uid, 1225);
    console.log('classification', classification);
    const synonyms = await this.archivistService.getRelatedOnUIDSubtypeCone(
      uid,
      1981,
    );
    // console.log("synonyms", synonyms);
    const inverses = await this.archivistService.getRelatedOnUIDSubtypeCone(
      uid,
      1986,
    );
    // console.log("inverses", inverses);
    const reqRole1 = await this.archivistService.getRelatedOnUIDSubtypeCone(
      uid,
      4731,
    );
    // console.log("reqRole1", reqRole1);
    const reqRole2 = await this.archivistService.getRelatedOnUIDSubtypeCone(
      uid,
      4733,
    );
    // console.log("reqRole2", reqRole2);
    const possRoles = await this.archivistService.getRelatedOnUIDSubtypeCone(
      uid,
      4714,
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

  async retrieveIndividualModel(uid: number) {
    const category = await this.archivistService.getCategory(uid);
    const facts = await this.archivistService.retrieveAllFacts(uid);
    const definitiveFacts = await this.archivistService.getDefinitiveFacts(uid);
    const classification =
      await this.archivistService.getRelatedOnUIDSubtypeCone(uid, 1225);
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
    ); // 'has on scale a value equal to'
    if (value.length > 0) {
      const valFact = value[0];
      const val = parseInt(valFact.rh_object_name);
      const uom = { uid: valFact.uom_uid, name: valFact.uom_name };
      return { ...baseObj, value: { quant: val, uom } };
    }
    return baseObj;
  }

  async retrieveQualificationModel(uid: number) {
    const category = await this.archivistService.getCategory(uid);
    const facts = await this.archivistService.retrieveAllFacts(uid);
    const definitiveFacts = await this.archivistService.getDefinitiveFacts(uid);
    const baseObj = {
      name: definitiveFacts[0].lh_object_name,
      uid: uid,
      type: 'qualification',
      category: category,
      facts,
    };
    return baseObj;
  }

  async retrieveModel(uid: number) {
    const res = await this.archivistService.getEntityType(uid);
    const type = res.type;

    console.log('type', type);

    if (type === 'kind') {
      return this.retrieveKindModel(uid);
    } else if (type === 'individual') {
      return this.retrieveIndividualModel(uid);
    } else if (type === 'qualification') {
      return this.retrieveQualificationModel(uid);
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
    const results = [];
    const executing = [];
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

  async retrieveModels(uids: number[]) {
    const funcs = uids.map((uid) => () => this.retrieveModel(uid));
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
