import {
  OCCURRENCE_UID,
  PHYSICAL_OBJECT_UID,
  ROLE_UID,
  ASPECT_UID,
  RELATION_UID,
} from '../bootstrapping';

import { Injectable, Logger } from '@nestjs/common';
import { GraphService } from 'src/graph/graph.service';
import { CacheService } from 'src/cache/cache.service';

import {
  entity,
  entities,
  specializationHierarchy,
  possibleRoles,
  synonyms,
  inverses,
  partialDefs,
  classificationFact,
  specializationFact,
  possibleRolePlayers,
  requiringRelations,
  requiredRole1,
  requiredRole2,
  fact,
  facts,
  updateFactDefinitionQuery,
  updateFactCollectionQuery,
  updateFactNameQuery,
  updateFactNamesQuery,
  qualificationFact,
  allFactsInvolvingEntity,
} from 'src/graph/queries';

import { linearize } from 'c3-linearization';

@Injectable()
export class GellishBaseService {
  private readonly logger = new Logger(GellishBaseService.name);

  constructor(
    private readonly graphService: GraphService,
    private readonly cacheService: CacheService,
  ) {}

  ////////////////////////////////////////////////////////////////////////////////

  getSpecializationHierarchy = async (uid: number) => {
    const classFact = await this.getClassificationFact(uid);
    if (classFact.length > 0) {
      uid = classFact[0].rh_object_uid;
    }

    const conceptsSet = new Set();
    const concepts = [];

    const lineage = await this.cacheService.lineageOf(uid);

    const facts = await lineage.reduce(async (accPromise, uid) => {
      const acc = await accPromise;
      const specFacts = await this.getSpecializationFact(uid);
      return acc.concat(specFacts); // Using concat to avoid nested arrays
    }, Promise.resolve([]));

    if (classFact.length > 0) {
      facts.push(classFact[0]);
    }

    facts.forEach((fact) => {
      const lh_uid = fact.lh_object_uid;
      const rh_uid = fact.rh_object_uid;
      if (lh_uid && !conceptsSet.has(lh_uid)) {
        conceptsSet.add(lh_uid);
        concepts.push({ uid: lh_uid });
      }
      if (rh_uid && !conceptsSet.has(rh_uid)) {
        conceptsSet.add(rh_uid);
        concepts.push({ uid: rh_uid });
      }
    });

    return { facts, concepts };
  };

  getSH = async (uid: number) => {
    const result = await this.getSpecializationHierarchy(uid);

    if (result.facts.length === 0) {
      return [];
    }

    return result.facts.map((item) => {
      return [item.lh_object_uid, item.rel_type_uid, item.rh_object_uid];
    });
  };

  getEntities = async (uids: number[]) => {
    const result = await this.graphService.execQuery(entities, { uids });
    if (result.length === 0) {
      return null;
    }
    return await Promise.all(
      result.map(async (record) => {
        const entity = record.get('n');
        this.graphService.convertNeo4jInts(entity);
        // get descendants from Redis
        const descendants = await this.cacheService.allDescendantsOf(
          entity.properties.uid,
        );

        // Combine the entity properties and the descendants
        return Object.assign({}, entity.properties, { descendants });
      }),
    );
  };

  getSpecializationFact = async (uid) => {
    const result = await this.graphService.execQuery(specializationFact, {
      uid,}); if (result.length === 0) {
      return [];
    }

    return result.map((r) => this.graphService.transformResult(r));
  };

  getSpecializationFacts = async (uids) => {
    if (Array.isArray(uids) && uids.length === 0) {
      return [];
    } else if (!Array.isArray(uids) && uids === undefined) {
      return [];
    } else if (!Array.isArray(uids)) {
      uids = [uids];
    }
    const result = (
      await Promise.all(
        uids.map(async (uid) => {
          const result = await this.getSpecializationFact(parseInt(uid));
          return result;
        }),
      )
    ).filter((x) => x.length > 0);

    return result.reduce((acc, curr) => {
      return acc.concat(curr);
    }, []);
  };

  getQualificationFact = async (uid) => {
    const result = await this.graphService.execQuery(qualificationFact, {
      uid,
    });
    if (result.length === 0) {
      return [];
    }

    return result.map((r) => this.graphService.transformResult(r));
  };

  getClassificationFact = async (uid) => {
    const result = await this.graphService.execQuery(classificationFact, {
      uid,
    });
    if (result.length === 0) return [];
    return this.graphService.transformResults(result);
  };

  getClassificationFacts = async (uids) => {
    const preres = await Promise.all(
      uids.map(async (uid) => {
        const result = await this.getClassificationFact(uid);
        return result;
      }),
    );
    const res = preres.reduce((acc, curr) => {
      return acc.concat(curr);
    }, []);
    return res;
  };

  getCategory = async (uid) => {
    console.log('GETTING CATEGORY MUTHER SUCKER!!!!', uid);
    //is this an individual or a kind?
    const classificationFact = await this.getClassificationFact(uid);
    if (classificationFact.length > 0) {
      uid = classificationFact[0].rh_object_uid;
    }

    const physicalObjectSubtypes =
      await this.cacheService.allDescendantsOf(PHYSICAL_OBJECT_UID);
    const roleSubtypes = await this.cacheService.allDescendantsOf(ROLE_UID);
    const aspectSubtypes = await this.cacheService.allDescendantsOf(ASPECT_UID);
    const relationSubtypes =
      await this.cacheService.allDescendantsOf(RELATION_UID);
    const occurrenceSubtypes =
      await this.cacheService.allDescendantsOf(OCCURRENCE_UID);

    if (physicalObjectSubtypes.includes(uid)) {
      return 'physical object';
    } else if (roleSubtypes.includes(uid)) {
      return 'role';
    } else if (aspectSubtypes.includes(uid)) {
      return 'aspect';
    } else if (occurrenceSubtypes.includes(uid)) {
      return 'occurrence';
    } else if (relationSubtypes.includes(uid)) {
      return 'relation';
    } else {
      return 'anything';
    }
  };

  getSynonyms = async (uid) => {
    const result = await this.graphService.execQuery(synonyms, { uid });
    return this.graphService.transformResults(result);
  };

  getInverses = async (uid) => {
    const result = await this.graphService.execQuery(inverses, { uid });
    return this.graphService.transformResults(result);
  };

  getPossibleRoles = async (uid) => {
    const specH = await this.getSpecializationHierarchy(uid);
    const facts = specH.facts;

    let i = 0;
    const uniqueResults = new Set(); // Use a Set to store unique entries
    while (i < facts.length - 1) {
      const fact = facts[i];
      const res = await this.graphService.execQuery(possibleRoles, {
        uid: fact.lh_object_uid,
      });

      res.forEach((item) => {
        const transformedItem = Object.assign(
          {},
          item.toObject().r.properties,
          {
            rel_type_name: item.get('r').type,
          },
        );
        uniqueResults.add(JSON.stringify(transformedItem)); // Add the stringified transformed item to the Set
      });

      i++;
    }

    if (uniqueResults.size === 0) {
      return [];
    }

    const transformedResult = Array.from(uniqueResults).map((item: string) =>
      JSON.parse(item),
    ); // Convert the unique items back to objects

    return transformedResult;
  };

  getPartialDefs = async (uid) => {
    const result = await this.graphService.execQuery(partialDefs, { uid });
    const ret = result.map((item) => {
      return {
        sourceUID: item.get('source_uid'),
        partialDef: item.get('partial_definition'),
      };
    });
    return ret;
  };

  getNames = async (uid) => {
    const specFact = await this.getSpecializationFact(uid);
    const specFactNames = specFact.map((x) => x.lh_object_name);
    const classFact = await this.getClassificationFact(uid);
    const classFactNames = classFact.map((x) => x.lh_object_name);
    const synonyms = await this.getSynonyms(uid);
    const synonymsNames = synonyms.map((x) => x.lh_object_name);
    const names = [...specFactNames, ...classFactNames, ...synonymsNames];
    return names;
  };

  getRequiredRole = async (relationUID, roleIndex) => {
    const specH = await this.getSpecializationHierarchy(relationUID);
    const query = roleIndex === 1 ? requiredRole1 : requiredRole2;

    let i = 0;
    let result = [];
    while (i < specH.facts.length - 1 && result.length === 0) {
      const fact = specH.facts[i];
      result = await this.graphService.execQuery(query, {
        uid: fact.lh_object_uid,
      });
      i++;
    }
    if (result.length === 0) {
      return null;
    }
    return this.graphService.transformResult(result[0]);
  };

  getRequiredRole1 = async (relationUID) => {
    return await this.getRequiredRole(relationUID, 1);
  };

  getRequiredRole2 = async (relationUID) => {
    return await this.getRequiredRole(relationUID, 2);
  };

  getPossibleRolePlayers = async (roleUID) => {
    const specH = await this.getSpecializationHierarchy(roleUID);
    const facts = specH.facts;

    let i = 0;
    let result = [];
    while (i <= facts.length - 1 && result.length === 0) {
      const fact = facts[i];
      const res = await this.graphService.execQuery(possibleRolePlayers, {
        uid: fact.lh_object_uid,
      });
      console.log(
        '!!!!!!!!!!!!111 GET POSSIBLE ROLE PLAYERS',
        typeof fact.lh_object_uid,
        fact.lh_object_uid,
        res,
      );
      result = [...result, ...res];
      i++;
    }
    if (result.length === 0) {
      return [];
    }
    return this.graphService.transformResults(result);
  };

  getRequiringRelations = async (roleUID) => {
    const specH = await this.getSpecializationHierarchy(roleUID);
    const facts = specH.facts;

    let i = 0;
    let result = [];
    while (i < facts.length - 1 && result.length === 0) {
      const fact = specH[i];
      const res = await this.graphService.execQuery(requiringRelations, {
        uid: fact.lh_object_uid,
      });
      result = [...result, ...res];
      i++;
    }
    if (result.length === 0) {
      return [];
    }
    return this.graphService.transformResult(result);
  };

  getFact = async (factUID) => {
    const result = await this.graphService.execQuery(fact, {
      uid: factUID,
    });
    if (result.length === 0) {
      return null;
    }
    const restultFact = result[0].get('n');
    this.graphService.convertNeo4jInts(restultFact);

    return restultFact.properties;
  };

  getFacts = async (factUIDs) => {
    const result = await this.graphService.execQuery(facts, {
      uids: factUIDs,
    });
    if (result.length === 0) {
      return null;
    }
    return result.map((record) => {
      const fact = record.get('n');
      this.graphService.convertNeo4jInts(fact);
      return fact.properties;
    });
  };

  getDefinitiveFacts = async (uid) => {
    const specializationFact = await this.getSpecializationFact(uid);
    const classificationFact = await this.getClassificationFact(uid);
    const qualificationFact = await this.getQualificationFact(uid);

    console.log('GET DEFINITIVE FACTS', uid);
    console.log(specializationFact, classificationFact, qualificationFact);

    if (
      specializationFact.length === 0 &&
      classificationFact.length === 0 &&
      qualificationFact.length === 0
    ) {
      return [];
    }

    if (specializationFact.length > 0) {
      console.log('RETURN SPEC FACT');
      return specializationFact;
    }

    if (classificationFact.length > 0) {
      console.log('RETURN CLASS FACT');
      return classificationFact;
    }

    if (qualificationFact.length > 0) {
      console.log('RETURN QUAL FACT');
      return qualificationFact;
    }

    console.log('RETURN NO FACT');
    return [];
  };

  updateFactDefinition = async (
    fact_uid,
    partial_definition,
    full_definition,
  ) => {
    const result = await this.graphService.execWriteQuery(
      updateFactDefinitionQuery,
      {
        fact_uid,
        partial_definition,
        full_definition,
      },
    );
    return this.graphService.transformResult(result[0]);
  };

  updateFactCollection = async (
    fact_uid: number,
    collection_uid: number,
    collection_name: string,
  ) => {
    this.logger.verbose(
      'UPDATE FACT COLLECTION',
      fact_uid,
      collection_uid,
      collection_name,
    );

    const result = await this.graphService.execWriteQuery(
      updateFactCollectionQuery,
      {
        fact_uid,
        collection_uid,
        collection_name,
      },
    );

    this.logger.verbose('UPDATE FACT COLLECTION', result);

    return this.graphService.transformResult(result[0]);
  };

  updateFactName = async (fact_uid: number, name: string) => {
    this.logger.verbose('UPDATE FACT NAME', fact_uid, name);

    const result = await this.graphService.execWriteQuery(updateFactNameQuery, {
      fact_uid,
      name,
    });

    this.logger.verbose('UPDATE FACT NAME', result);

    return this.graphService.transformResult(result[0]);
  };

  // renameFactName = async (uid: number, oldName: string, newName: string) => {
  // renameFactInContext = async (uid: number, context_uid: number, newName: string) => {

  blanketUpdateFactName = async (uid: Number, newName: string) => {
    const foo = await this.graphService.execQuery(allFactsInvolvingEntity, {
      uid: uid,
    });
    const bar = foo.map((x) => x.get('r').properties);
    const baz = bar.map((x) => {
      if (x.rh_object_uid === uid) x.rh_object_name = newName;
      if (x.lh_object_uid === uid) x.lh_object_name = newName;
      return x;
    });

    //for each in baz run updateFactNamesQuery
    const result = await Promise.all(
      baz.map(async (fact) => {
        return await this.graphService.execWriteQuery(updateFactNamesQuery, {
          fact_uid: fact.fact_uid,
          lh_name: fact.lh_object_name,
          rh_name: fact.rh_object_name,
        });
      }),
    );

    // for (let i = 0; i < result.length; i++) {
    //   console.log('RESULT', result[i][0].get('r').properties);
    // }

    const barResult = result.map((x) => x[0].get('r').properties);

    // console.log('RESULT', barResult);

    this.logger.verbose('BLANKET UPDATE FACT NAME', barResult);
    return barResult;
  };
}
