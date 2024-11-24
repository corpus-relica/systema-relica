import { Injectable, Logger } from '@nestjs/common';
import { Fact } from '@relica/types';
import { UIDService } from 'src/uid/uid.service';
import { GraphService } from 'src/graph/graph.service';
import { ConceptService } from 'src/concept/concept.service';
import { createFact } from 'src/graph/queries';

import {
  subtypes,
  supertypes,
  classified,
  factsAboutIndividual,
  allRelatedFactsQuery,
  allRelatedFactsQueryb,
  allRelatedFactsQueryc,
  allRelatedFactsQueryd,
  deleteFactQuery,
  deleteEntityQuery,
} from 'src/graph/queries';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class FactService {
  private readonly logger = new Logger(FactService.name);

  constructor(
    private readonly graphService: GraphService,
    private readonly gellishBaseService: GellishBaseService,
    private readonly cacheService: CacheService,
    private readonly conceptService: ConceptService,
    private readonly uidService: UIDService,
  ) {}

  isTempUIDP = (uid) => {
    return parseInt(uid) >= 1 && parseInt(uid) <= 100;
  };

  getSubtypes = async (uid) => {
    const result = await this.graphService.execQuery(subtypes, { uid });
    const facts = result.map((item) => {
      const obj = this.graphService.convertNeo4jInts(item.toObject().r);
      return Object.assign({}, obj.properties);
    });
    return facts;
  };

  getSubtypesCone = async (uid) => {
    const subtypes = await this.cacheService.allDescendantsOf(uid);
    const facts = await Promise.all(
      subtypes.map(async (subtype) => {
        const result = await this.graphService.execQuery(supertypes, {
          uid: subtype,
        });
        return result.map((item) => {
          const obj = this.graphService.convertNeo4jInts(item.toObject().r);
          return Object.assign({}, obj.properties);
        });
      }),
    );

    const flattenedFacts = facts.flat();
    return flattenedFacts;
  };

  getClassified = async (uid: number, recursive: boolean = false) => {
    if (!recursive) {
      const result = await this.graphService.execQuery(classified, { uid });
      if (result.length === 0) return [];
      return this.graphService.transformResults(result);
    } else {
      const subtypes = await this.cacheService.allDescendantsOf(uid);
      const facts = await Promise.all(
        subtypes.map(async (subtype) => {
          const result = await this.graphService.execQuery(classified, {
            uid: subtype,
          });
          return this.graphService.transformResults(result);
        }),
      );

      const flattenedFacts = facts.flat();

      return flattenedFacts;
    }
  };

  getFactsAboutRole = async (uid) => {
    const possRolePlayers =
      await this.gellishBaseService.getPossibleRolePlayers(uid);
    const requiringRels =
      await this.gellishBaseService.getRequiringRelations(uid);

    return { possRolePlayers, requiringRels };
  };
  getFactsAboutQuality = async (uid) => {
    return {};
  };
  getFactsAboutAspect = async (uid) => {
    return {};
  };
  getFactsAboutOccurrence = async (uid) => {
    const role1 = await this.gellishBaseService.getRequiredRole1(uid);
    const role2 = await this.gellishBaseService.getRequiredRole2(uid);

    return { reqRoles: [role1, role2] };
  };
  getFactsAboutPhysicalObject = async (uid) => {
    return {};
  };
  getFactsAboutRelation = async (uid) => {
    const role1 = await this.gellishBaseService.getRequiredRole1(uid);
    const role2 = await this.gellishBaseService.getRequiredRole2(uid);

    return { reqRoles: [role1, role2] };
  };

  getFactsAboutKind = async (uid) => {
    // getAllFactsAboutKind(uid);
    if (uid === '730000') return {};

    const category = await this.gellishBaseService.getCategory(uid);
    const specH = await this.gellishBaseService.getSpecializationHierarchy(uid);
    const syn = await this.gellishBaseService.getSynonyms(uid);
    const inv = await this.gellishBaseService.getInverses(uid);
    const partialDefs = await this.gellishBaseService.getPartialDefs(uid);
    const possRoles = await this.gellishBaseService.getPossibleRoles(uid);

    const commonComponents = {
      category,
      specH,
      syn,
      inv,
      partialDefs,
      possRoles,
    };

    switch (category) {
      case 'occurrence':
        return Object.assign(
          {},
          commonComponents,
          await this.getFactsAboutOccurrence(uid),
        );
      case 'physical object':
        return Object.assign(
          {},
          commonComponents,
          await this.getFactsAboutPhysicalObject(uid),
        );
      case 'role':
        return Object.assign(
          {},
          commonComponents,
          await this.getFactsAboutRole(uid),
        );
      // case 'quality':
      //     return Object.assign(
      //         {},
      //         commonComponents,
      //         await this.getFactsAboutQuality(uid),
      //     );
      case 'aspect':
        return Object.assign(
          {},
          commonComponents,
          await this.getFactsAboutAspect(uid),
        );
      case 'relation':
        return Object.assign(
          {},
          commonComponents,
          await this.getFactsAboutRelation(uid),
        );
      default:
        return commonComponents;
    }
  };

  getAllRelatedFacts = async (uid: number) => {
    const subtypes1146 = await this.cacheService.allDescendantsOf(1146); // 'is a specialization of'
    const subtypes2850 = await this.cacheService.allDescendantsOf(2850); // 'relation'

    const rel_type_uids = subtypes2850.filter(
      (item) => !subtypes1146.includes(item) && item !== 1146,
    );

    const results2850 = await this.graphService.execQuery(
      allRelatedFactsQueryc,
      {
        start_uid: uid,
        rel_type_uids,
      },
    );
    const res2850 = this.graphService.transformResults(results2850);

    const results2850b = await this.graphService.execQuery(
      allRelatedFactsQueryd,
      {
        start_uid: uid,
        rel_type_uids,
      },
    );
    const res2850b = this.graphService.transformResults(results2850b);

    return res2850.concat(res2850b);
  };

  getAllRelatedFactsRecursive = async (uid: number, depth = 1) => {
    const maxDepth = 3; // Define the maximum allowed depth
    const actualDepth = Math.min(depth, maxDepth); // Ensure the depth does not exceed the maximum

    const recurse = async (
      currentUid: number,
      currDepth: number,
    ): Promise<Fact[]> => {
      if (currDepth < actualDepth) {
        let result = await this.getAllRelatedFacts(currentUid);
        let nextUids = result.map((item) => item.lh_object_uid);

        let recursiveResults = await Promise.all(
          nextUids.map((nextUid) => recurse(nextUid, currDepth + 1)),
        );
        return [...result, ...recursiveResults.flat()];
      } else {
        return [];
      }
    };

    const prelimResult: Fact[] = await recurse(uid, 0);
    const uniqueResults: Fact[] = prelimResult.filter((item, index) => {
      const indexOfFirstOccurence = prelimResult.findIndex(
        (item2: Fact) => item2.fact_uid === item.fact_uid,
      );
      return indexOfFirstOccurence === index;
    });

    return uniqueResults;
  };

  getFactsAboutIndividual = async (uid) => {
    const result = await this.graphService.execQuery(factsAboutIndividual, {
      uid,
    });
    const transformedResult = result.map((item) => {
      return Object.assign({}, item.toObject().r.properties, {
        rel_type_name: item.get('r').type,
      });
    });

    return { factsAboutIndividual: transformedResult };
  };

  getRelatedOnUIDSubtypeCone = async (
    lh_object_uid: number,
    rel_type_uid: number,
  ) => {
    const subtypesOfRelType = (
      await this.cacheService.allDescendantsOf(rel_type_uid)
    ).concat([rel_type_uid]);

    const results = await this.graphService.execQuery(allRelatedFactsQueryc, {
      start_uid: lh_object_uid,
      rel_type_uids: subtypesOfRelType,
    });
    const res = this.graphService.transformResults(results);

    const possiblyReduntResults = res; //.concat(resb);
    const uniqueResults = possiblyReduntResults.filter(
      (item: Fact, index: number) => {
        const indexOfFirstOccurence = possiblyReduntResults.findIndex(
          (item2: Fact) => item2.fact_uid === item.fact_uid,
        );
        return indexOfFirstOccurence === index;
      },
    );

    return uniqueResults;
  };

  getFactsRelatingEntities = async (uid1: number, uid2: number) => {
    const results = await this.graphService.execQuery(allRelatedFactsQuery, {
      start_uid: uid1,
      end_uid: uid2,
    });
    const res = this.graphService.transformResults(results);

    const resultsb = await this.graphService.execQuery(allRelatedFactsQueryb, {
      start_uid: uid1,
      end_uid: uid2,
    });
    const resb = this.graphService.transformResults(resultsb);

    const possiblyReduntResults = res.concat(resb);
    const uniqueResults = possiblyReduntResults.filter((item, index) => {
      const indexOfFirstOccurence = possiblyReduntResults.findIndex(
        (item2) => item2.fact_uid === item.fact_uid,
      );
      return indexOfFirstOccurence === index;
    });

    return uniqueResults;
  };

  confirmFact = async (fact: Fact): Promise<Fact | null> => {
    try {
      const result = await this.graphService.execQuery(
        `MATCH (r:Fact {lh_object_uid: $lh_object_uid, rh_object_uid: $rh_object_uid, rel_type_uid: $rel_type_uid})
RETURN r
`,
        {
          lh_object_uid: fact.lh_object_uid,
          rh_object_uid: fact.rh_object_uid,
          rel_type_uid: fact.rel_type_uid,
        },
      );
      if (result.length === 0) {
        return null;
      }
      return this.graphService.transformResults(result)[0];
    } catch (error) {
      this.logger.error('Error while finding fact:', error);
    } finally {
    }
    return null;
  };

  async confirmFactInRelationCone(
    lh_object_uids: number[] | null,
    rel_type_uids: number[] | null,
    rh_object_uids: number[] | null,
  ): Promise<Fact[] | null> {
    if (
      lh_object_uids === null &&
      rel_type_uids === null &&
      rh_object_uids === null
    ) {
      throw new Error(
        'At least one of lh_object_uid, rel_type_uid, or rh_object_uid must be non-null',
      );
    }

    let query = `MATCH (r:Fact) WHERE 1=1`;
    const params: any = {};

    if (lh_object_uids !== null) {
      query += ` AND r.lh_object_uid IN $lh_object_uids`;
      params.lh_object_uids = lh_object_uids;
    }

    if (rh_object_uids !== null) {
      query += ` AND r.rh_object_uid IN $rh_object_uids`;
      params.rh_object_uids = rh_object_uids;
    }

    if (rel_type_uids !== null) {
      // const relSubtypes = rel_type_uids.reduce((acc, curr) => {
      //   return acc.concat(this.cacheService.allDescendantsOf(curr));
      // }, []);
      const relSubtypes = [];
      for (let i = 0; i < rel_type_uids.length; i++) {
        const tempSubtypes = await this.cacheService.allDescendantsOf(
          rel_type_uids[i],
        );
        relSubtypes.push(rel_type_uids[i]);
        relSubtypes.push(...tempSubtypes);
      }
      query += ` AND r.rel_type_uid IN $relSubtypes`;
      params.relSubtypes = relSubtypes;
    }

    query += ` RETURN r`;

    try {
      const results = await this.graphService.execQuery(query, params);

      if (results.length === 0) {
        return [];
      }

      return this.graphService.transformResults(results);
    } catch (error) {
      this.logger.error('Error while finding facts:', error);
      return null;
    }
  }

  deleteFact = async (uid) => {
    const fact = await this.gellishBaseService.getFact(uid);
    const { fact_uid, lh_object_uid, rh_object_uid } = fact;

    const lhFactUIDs =
      await this.cacheService.allFactsInvolvingEntity(lh_object_uid);
    const rhFactUIDs =
      await this.cacheService.allFactsInvolvingEntity(rh_object_uid);

    await this.cacheService.removeFromFactsInvolvingEntity(
      lh_object_uid,
      fact_uid,
    );
    await this.cacheService.removeFromFactsInvolvingEntity(
      rh_object_uid,
      fact_uid,
    );
    await this.graphService.execWriteQuery(deleteFactQuery, {
      uid: fact_uid,
    });

    // remove orphans
    if (lhFactUIDs.length === 1 && lhFactUIDs[0] === uid) {
      await this.cacheService.removeEntity(lh_object_uid);
      await this.conceptService.deleteEntity(lh_object_uid);
    }
    if (rhFactUIDs.length === 1 && rhFactUIDs[0] === uid) {
      await this.cacheService.removeEntity(rh_object_uid);
      await this.conceptService.deleteEntity(rh_object_uid);
    }

    return { result: 'success', uid: uid, deletedFact: fact };
  };

  //TODO: if essential fields are partially complete (e.g. only rh_object_uid is
  //provided), then the function should resolve the missing fields by querying
  //the graph
  submitBinaryFact = async (fact) => {
    try {
      const [lh_object_uid, rh_object_uid, fact_uid] =
        this.uidService.reserveUID(3);

      let finalFact = Object.assign({}, fact, { fact_uid });

      if (
        parseInt(fact.lh_object_uid) >= 0 &&
        parseInt(fact.lh_object_uid) <= 100
      ) {
        finalFact = Object.assign({}, finalFact, {
          lh_object_uid,
        });
        const result = await this.graphService.execWriteQuery(
          `MERGE (n:Entity {uid: $uid}) RETURN n`,
          {
            uid: lh_object_uid,
          },
        );
        if (result.length == 0) {
          throw new Error('LH Merge operation failed');
        }
      }

      if (
        parseInt(fact.rh_object_uid) >= 0 &&
        parseInt(fact.rh_object_uid) <= 100
      ) {
        finalFact = Object.assign({}, finalFact, {
          rh_object_uid,
        });
        const result = await this.graphService.execWriteQuery(
          `MERGE (n:Entity {uid: $uid}) RETURN n`,
          {
            uid: rh_object_uid,
          },
        );
        if (result.length == 0) {
          throw new Error('RH Merge operation failed');
        }
      }

      const result = await this.graphService.execWriteQuery(createFact, {
        lh_object_uid: finalFact.lh_object_uid,
        rh_object_uid: finalFact.rh_object_uid,
        properties: finalFact,
      });

      if (!result || result.length == 0) {
        return {
          success: false,
          message: 'Execution of createFact failed',
        };
      }

      const convertedResult = this.graphService.convertNeo4jInts(
        result[0].toObject().r,
      );
      const returnFact = Object.assign(
        { rel_type_name: finalFact.rel_type_name },
        convertedResult.properties,
      );

      // UPATE CACHE
      // collect all the uids of the nodes involved in the fact
      const uids = [returnFact.lh_object_uid, returnFact.rh_object_uid];
      await Promise.all(
        uids.map(async (uid) => {
          await this.cacheService.updateFactsInvolvingEntity(uid);
        }),
      );
      //

      return {
        success: true,
        fact: returnFact,
      };
    } catch (error) {
      console.error(`Error in submitBinaryFact: ${error.message}`);
      // Rethrow the error if you want to handle it in a higher level of your app
      // throw error;
      return { success: false, message: error.message };
    }
  };

  submitBinaryFacts = async (facts) => {
    this.logger.log(`/////  submitBinaryFacts  /////`);
    this.logger.log(facts);

    const tempUIDs = Array.from(
      facts
        .reduce((acc, fact) => {
          if (this.isTempUIDP(fact.lh_object_uid)) acc.add(fact.lh_object_uid);
          if (this.isTempUIDP(fact.rh_object_uid)) acc.add(fact.rh_object_uid);
          if (this.isTempUIDP(fact.rel_type_uid)) acc.add(fact.rel_type_uid);
          return acc;
        }, new Set())
        .values(),
    );

    const newUIDMap = tempUIDs.reduce((acc, tempUID: number) => {
      acc[tempUID] = this.uidService.reserveUID()[0];
      return acc;
    }, {});

    const resolvedFacts = facts.map((fact, index) => {
      const { lh_object_uid, rel_type_uid, rh_object_uid } = fact;

      // if the uid is a temp uid, replace it with the new uid
      return Object.assign({}, fact, {
        fact_uid: this.uidService.reserveUID()[0],
        lh_object_uid: this.isTempUIDP(lh_object_uid)
          ? newUIDMap[lh_object_uid]
          : lh_object_uid,
        rh_object_uid: this.isTempUIDP(rh_object_uid)
          ? newUIDMap[rh_object_uid]
          : rh_object_uid,
        rel_type_uid: this.isTempUIDP(rel_type_uid)
          ? newUIDMap[rel_type_uid]
          : rel_type_uid,
      });
    });

    console.log('resolvedFacts', resolvedFacts);

    try {
      // Create nodes
      const createNodesQuery = `
  UNWIND $params AS param
  MERGE (n:Entity {uid: param.uid})
  RETURN n`;

      // collect all the uids of the nodes involved in the fact
      const nodeParams = resolvedFacts.flatMap((item) => [
        { uid: parseInt(item.lh_object_uid) },
        { uid: parseInt(item.rh_object_uid) },
      ]);

      const result = await this.graphService.execWriteQuery(createNodesQuery, {
        params: nodeParams,
      });

      // Create relationships
      const createRelationshipsQuery = `
  UNWIND $params AS param
  MATCH (lh:Entity {uid: param.lh_object_uid})
  MATCH (rh:Entity {uid: param.rh_object_uid})
CREATE (r:Fact)
SET r += param.properties
WITH lh, rh, r
CALL apoc.create.relationship(lh, 'role', {}, r) YIELD rel AS rel1
CALL apoc.create.relationship(r, 'role', {}, rh) YIELD rel AS rel2
RETURN r
`;

      const relationshipParams = resolvedFacts.map((item) => ({
        lh_object_uid: item.lh_object_uid,
        rh_object_uid: item.rh_object_uid,
        rel_type_uid: item.rel_type_uid,
        rel_type_name: item.rel_type_name,
        properties: item,
      }));

      const result2 = await this.graphService.execWriteQuery(
        createRelationshipsQuery,
        {
          params: relationshipParams,
        },
      );

      const returnFacts = result2.map((item) => {
        return Object.assign(
          { rel_type_name: item.get('r').type },
          item.toObject().r.properties,
        );
      });

      // UPATE CACHE
      // collect all the uids of the nodes involved in the fact
      // const uids = resolvedFacts.flatMap((fact) => [
      //   fact.lh_object_uid,
      //   fact.rh_object_uid,
      // ]);
      // await Promise.all(
      //   uids.map(async (uid) => {
      //     await this.cacheService.updateFactsInvolvingEntity(uid);
      //   }),
      // );
      await Promise.all(
        resolvedFacts.map(async (fact) => {
          await this.cacheService.appendFact(fact);
        }),
      );
      //

      return {
        success: true,
        facts: returnFacts,
      };
    } catch (error) {
      console.error(`Error in submitBinaryFacts: ${error.message}`);
      return { success: false, message: error.message };
    }
  };
}
