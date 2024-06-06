import { Injectable } from '@nestjs/common';
import { GraphService } from 'src/graph/graph.service';

import {
  subtypes,
  supertypes,
  classified,
  factsAboutIndividual,
} from 'src/graph/queries';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class FactRetrievalService {
  constructor(
    private readonly graphService: GraphService,
    private readonly gellishBaseService: GellishBaseService,
    private readonly cacheService: CacheService,
  ) {}

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

  getClassified = async (uid) => {
    console.log('GET CLASSIFIED');
    const result = await this.graphService.execQuery(classified, { uid });
    console.log(result);
    console.log('GET CLASSIFIED ?');
    if (result.length === 0) return [];
    console.log('GET CLASSIFIED ??');
    console.log(result);
    console.log(this.graphService.transformResults(result));
    console.log('GET CLASSIFIED ???');
    return this.graphService.transformResults(result);
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

  getAllRelatedFacts = async (uid) => {
    const allRelatedFactsQuery = `
MATCH (start:Entity)--(r)-->(end:Entity)
WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
RETURN r
`;

    const allRelatedFactsQueryb = `
MATCH (start:Entity)<--(r)--(end:Entity)
WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
RETURN r
`;

    const subtypes1146 = await this.cacheService.allDescendantsOf(1146); // 'is a specialization of'
    const subtypes2850 = await this.cacheService.allDescendantsOf(2850); // 'relation'

    const rel_type_uids = subtypes2850.filter(
      (item) => !subtypes1146.includes(item) && item !== 1146,
    );

    const results2850 = await this.graphService.execQuery(
      allRelatedFactsQuery,
      {
        start_uid: uid,
        rel_type_uids,
      },
    );
    const res2850 = this.graphService.transformResults(results2850);

    const results2850b = await this.graphService.execQuery(
      allRelatedFactsQueryb,
      {
        start_uid: uid,
        rel_type_uids,
      },
    );
    const res2850b = this.graphService.transformResults(results2850b);

    return res2850.concat(res2850b);
  };

  getAllRelatedFactsRecursive = (uid, depth = 1) => {
    const maxDepth = 3; // Define the maximum allowed depth
    const actualDepth = Math.min(depth, maxDepth); // Ensure the depth does not exceed the maximum

    const recurse = async (currentUid, currDepth) => {
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

    return recurse(uid, 0);
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

  getRelatedOnUIDSubtypeCone = async (lh_object_uid, rel_type_uid) => {
    console.log('GRoUSC', lh_object_uid, rel_type_uid);
    const subtypesOfRelType = (
      await this.cacheService.allDescendantsOf(rel_type_uid)
    ).concat([rel_type_uid]);
    const allRelatedFactsQuery = `
MATCH (start:Entity)--(r)-->(end:Entity)
WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
RETURN r
`;

    //   const allRelatedFactsQueryb = `
    // MATCH (start:Entity)<--(r)--(end:Entity)
    // WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
    // RETURN r
    // `;

    const results = await this.graphService.execQuery(allRelatedFactsQuery, {
      start_uid: lh_object_uid,
      rel_type_uids: subtypesOfRelType,
    });
    const res = this.graphService.transformResults(results);

    // const resultsb = await this.graphService.execQuery(allRelatedFactsQueryb, {
    //   start_uid: lh_object_uid,
    //   rel_type_uids: subtypesOfRelType,
    // });
    // const resb = transformResults(resultsb);

    const possiblyReduntResults = res; //.concat(resb);
    const uniqueResults = possiblyReduntResults.filter((item, index) => {
      const indexOfFirstOccurence = possiblyReduntResults.findIndex(
        (item2) => item2.fact_uid === item.fact_uid,
      );
      return indexOfFirstOccurence === index;
    });

    return uniqueResults;
  };

  getFactsRelatingEntities = async (uid1, uid2) => {
    console.log(
      'GET FACTS RELATIONG ENTITIES ------------------------------------------!',
      uid1,
      uid2,
    );
    const allRelatedFactsQuery = `
MATCH (start:Entity)--(r)-->(end:Entity)
WHERE start.uid = $start_uid AND end.uid = $end_uid
RETURN r
`;

    const allRelatedFactsQueryb = `
MATCH (start:Entity)<--(r)--(end:Entity)
WHERE start.uid = $start_uid AND end.uid = $end_uid
RETURN r
`;

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
}
