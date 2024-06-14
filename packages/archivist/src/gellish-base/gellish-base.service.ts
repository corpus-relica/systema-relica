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
  qualificationFact,
} from 'src/graph/queries';

import { linearize } from 'c3-linearization';

@Injectable()
export class GellishBaseService {
  private readonly logger = new Logger(GellishBaseService.name);

  constructor(
    private readonly graphService: GraphService,
    private readonly cacheService: CacheService,
  ) {}

  /////////////////////////////////////////////////////////////  LINEARIZATION  //

  /** that is, *without* using cache */
  async calculateSpecializationHierarchy(uid: number) {
    const specializationHierarchy = `
MATCH path = (start:Entity)-[]->(f1:Fact)-[]->(end:Entity)
WHERE start.uid = $uid AND end.uid = 730000 AND f1.rel_type_uid IN $rel_type_uids
RETURN path

UNION

MATCH path = (start:Entity)-[]->(f2:Fact)-[]->(:Entity)
((:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(:Entity)){0,100}
(:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(end:Entity)
WHERE start.uid = $uid AND end.uid = 730000 AND f2.rel_type_uid IN $rel_type_uids
RETURN path`;
    try {
      const result = await this.graphService.execQuery(
        specializationHierarchy,
        {
          uid,
          rel_type_uids: [1146, 1726],
        },
      );
      return result.map((record) => record.get('path'));
    } catch (error) {
      console.error('Error fetching specialization hierarchy:', error);
      return [];
    }
  }

  /** that is, *without* using cache */
  async calculateLineage(uid: number) {
    console.log('CALCULATE LINEAGE', uid);

    const result = await this.calculateSpecializationHierarchy(uid);

    if (result.length === 0) {
      return [];
    }

    const factsSet = new Set();
    const facts: any[] = [];
    console.log('RESULT', result.length);
    // console.log(result);
    result.forEach((path) => {
      // @ts-ignore
      path.segments.forEach((segment) => {
        // @ts-ignore
        const { start, relationship, end } = segment;

        // Assuming that if a node has the label 'Fact', it is a Fact node
        if (start.labels.includes('Fact')) {
          this.graphService.resolveNeo4jInt(start); // Convert Neo4j integers to JS integers if needed
          const startProps = start.properties;
          const factUID = startProps.fact_uid;

          // Use a Set for unique checking
          if (!factsSet.has(factUID)) {
            factsSet.add(factUID);
            facts.push(startProps);
          }
        }

        // Repeat the check for the end node
        if (end.labels.includes('Fact')) {
          this.graphService.resolveNeo4jInt(end); // Convert Neo4j integers to JS integers if needed
          const endProps = end.properties;
          const factUID = endProps.fact_uid;

          if (!factsSet.has(factUID)) {
            factsSet.add(factUID);
            facts.push(endProps);
          }
        }
      });
    });

    const graph = facts.reduce((acc, fact) => {
      const lh_uid = fact.lh_object_uid;
      const rh_uid = fact.rh_object_uid;
      if (!acc[lh_uid]) acc[lh_uid] = [];
      acc[lh_uid].push(rh_uid);
      return acc;
    }, {});

    const lineage = linearize(graph);

    Object.keys(lineage).forEach((key) => {
      // @ts-ignore
      lineage[key] = lineage[key].map((uid) => parseInt(uid));
    });

    return lineage[uid];
  }

  getLineage = async (uid: number) => {
    const lineage = await this.cacheService.lineageOf(uid);
    console.log('GOT LINEAGE (', uid, ')', lineage);
    console.log(
      'GOT LINEAGE (',
      uid,
      ')',
      lineage.map((x) => typeof x),
    );
    return lineage;
  };

  ////////////////////////////////////////////////////////////////////////////////

  getSpecializationHierarchy = async (uid: number) => {
    const conceptsSet = new Set();
    const concepts = [];

    const lineage = await this.getLineage(uid);
    // lineage.pop();

    const facts = await lineage.reduce(async (accPromise, uid) => {
      const acc = await accPromise;
      const specFacts = await this.getSpecializationFact(uid);
      return acc.concat(specFacts); // Using concat to avoid nested arrays
    }, Promise.resolve([]));

    const allFacts = await Promise.all(facts);

    allFacts.forEach((fact) => {
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
    console.log('UIDS', uids);
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
      uid,
    });
    if (result.length === 0) {
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
    return await Promise.all(
      uids.map(async (uid) => {
        const result = await this.getSpecializationFact(parseInt(uid));
        return result;
      }),
    );
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
    return await Promise.all(
      uids.map(async (uid) => {
        const result = await this.getClassificationFact(uid);
        return result;
      }),
    );
  };

  getCategory = async (uid) => {
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
}
