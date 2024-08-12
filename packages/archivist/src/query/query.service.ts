import { Injectable, Logger } from '@nestjs/common';
import { GraphService } from 'src/graph/graph.service';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';
import { FactRetrievalService } from 'src/fact-retrieval/fact-retrieval.service';
import { Fact } from '@relica/types';
import { GellishToCypherConverter } from './GellishToCypherConverter';

import { Record } from 'neo4j-driver';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(
    private readonly graphService: GraphService,
    private readonly factRetrieval: FactRetrievalService,
    private readonly gellishBaseService: GellishBaseService,
    private readonly gellishToCypherConverter: GellishToCypherConverter,
  ) {}

  async interpretTable(table: Fact[]): Promise<{ facts: Fact[]; vars: any[] }> {
    try {
      const { query, params } =
        await this.gellishToCypherConverter.processGellishQuery(table);
      const result = await this.graphService.execQuery(query, params);

      // this.logger.debug('Cypher query results:', result);

      const { facts, variables } = this.processCypherResults(result);
      const resolvedVars = this.resolveVariables(variables, table);

      const resolvedUIDs: number[] = resolvedVars.reduce((acc, curr) => {
        acc.push(...curr.possibleValues);
        return acc;
      }, []);

      const specFacts: Fact[] =
        await this.gellishBaseService.getSpecializationFacts(resolvedUIDs);
      const classFacts: Fact[] =
        await this.gellishBaseService.getClassificationFacts(resolvedUIDs);

      this.logger.debug('Interpreted table:', specFacts, classFacts);

      return {
        facts: [...specFacts, ...classFacts, ...facts],
        vars: resolvedVars,
      };
    } catch (error) {
      this.logger.error('Error interpreting query table', error);
      throw error;
    }
  }

  private processCypherResults(cypherResults: Record[]): {
    facts: Fact[];
    variables: Map<string, any>;
  } {
    const uniqueFacts = new Map<string, Fact>();
    const variables = new Map<string, any>();

    cypherResults.forEach((record) => {
      record.keys.forEach((key: string) => {
        if (key.startsWith('f')) {
          const factNode = record.get(key);
          if (factNode && factNode.properties) {
            const fact = this.graphService.convertNeo4jInts(factNode)
              .properties as Fact;
            const factKey = JSON.stringify(fact);
            if (!uniqueFacts.has(factKey)) {
              uniqueFacts.set(factKey, fact);
            }
          }
        } else {
          const varNode = record.get(key);
          console.log('varNode', key, varNode);
          if (varNode) {
            const s: Set<number> = variables.get(key) || new Set<number>();
            console.log('varNode.uid', varNode.uid);
            s.add(varNode.uid);
            variables.set(key, s);
          }
        }
      });
    });

    return {
      facts: Array.from(uniqueFacts.values()),
      variables,
    };
  }

  private resolveVariables(
    variables: Map<string, any>,
    originalQuery: Fact[],
  ): any[] {
    const result = {};
    originalQuery.forEach((queryFact, index) => {
      return ['lh_object_uid', 'rel_type_uid', 'rh_object_uid'].forEach(
        (key, position) => {
          const uid = queryFact[key];
          if (this.isTempUID(uid)) {
            const varName = `var_${uid}`;
            const name =
              queryFact[
                ['lh_object_name', 'rel_type_name', 'rh_object_name'][position]
              ];
            const matchingVar: Set<number> = variables.get(varName);
            if (!result[name]) {
              result[name] = {
                uid,
                name,
                possibleValues: matchingVar ? Array.from(matchingVar) : [],
                isResolved: !!matchingVar,
              };
            }
            console.log('matchingVar', name, matchingVar);
          }
        },
      );
    });
    return Object.values(result);
  }

  // private extractVariables(cypherResults: any[], originalQuery: Fact[]): any[] {
  //   const variables: any[] = [];
  //   originalQuery.forEach((queryFact, index) => {
  //     [
  //       { key: 'lh_object_uid', name: 'lh_object' },
  //       { key: 'rel_type_uid', name: 'rel_type' },
  //       { key: 'rh_object_uid', name: 'rh_object' },
  //     ].forEach(({ key, name }) => {
  //       const uid = queryFact[key];
  //       if (this.isTempUID(uid)) {
  //         let matchingResults;
  //         if (key === 'rel_type_uid') {
  //           matchingResults = cypherResults
  //             .map((result) => result[`f${index}`]?.rel_type_uid)
  //             .filter(Boolean);
  //         } else {
  //           matchingResults = cypherResults
  //             .map((result) => result[`var_${uid}`]?.uid)
  //             .filter(Boolean);
  //         }
  //         variables.push({
  //           uid,
  //           name,
  //           possibleValues: [...new Set(matchingResults)], // Remove duplicates
  //           isResolved: matchingResults.length === 1,
  //         });
  //       }
  //     });
  //   });
  //   return variables;
  // }

  private isTempUID(uid: number): boolean {
    return uid >= 1 && uid <= 99;
  }
}
