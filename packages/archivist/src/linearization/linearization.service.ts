import { Injectable } from '@nestjs/common';
import { GraphService } from 'src/graph/graph.service';

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
  qualificationFact,
} from 'src/graph/queries';

import { linearize } from 'c3-linearization';

@Injectable()
export class LinearizationService {
  constructor(private readonly graphService: GraphService) {}

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
}
