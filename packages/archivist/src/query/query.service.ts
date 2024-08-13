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

  async interpretTable(
    table: Fact[],
    page: number,
    pageSize: number,
  ): Promise<{
    facts: Fact[];
    groundingFacts: Fact[];
    vars: any[];
    totalCount: number;
  }> {
    try {
      const { query, params } =
        await this.gellishToCypherConverter.processGellishQuery(
          table,
          page,
          pageSize,
        );
      const result = await this.graphService.execQuery(query, params);
      const { facts, variables } = this.processCypherResults(result);
      const resolvedVars = this.resolveVariables(variables, table);
      const resolvedUIDs: number[] = resolvedVars.reduce((acc, curr) => {
        acc.push(...curr.possibleValues);
        return acc;
      }, []);
      const unanchoredUIDs = resolvedUIDs.filter((uid) => {
        return !facts.some((fact) => {
          return (
            (fact.lh_object_uid === uid && fact.rel_type_uid === 1146) ||
            fact.rel_type_uid === 1225 ||
            fact.rel_type_uid === 1726
          );
        });
      });
      console.log('XXX', unanchoredUIDs);
      const specFacts: Fact[] =
        await this.gellishBaseService.getSpecializationFacts(unanchoredUIDs);
      const classFacts: Fact[] =
        await this.gellishBaseService.getClassificationFacts(unanchoredUIDs);
      // Get total count
      const totalCount = await this.getTotalCount(table);
      return {
        facts: facts,
        groundingFacts: [...specFacts, ...classFacts],
        vars: resolvedVars,
        totalCount,
      };
    } catch (error) {
      this.logger.error('Error interpreting query table', error);
      throw error;
    }
  }

  private async getTotalCount(table: Fact[]): Promise<number> {
    const { query, params } =
      await this.gellishToCypherConverter.processGellishQuery(table, 1, 1);
    const countQuery = `${query.split('RETURN')[0]} RETURN count(*) as total`;
    const result = await this.graphService.execQuery(countQuery, params);
    return result[0].get('total').toNumber();
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
          if (varNode) {
            const s: Set<number> = variables.get(key) || new Set<number>();
            s.add(this.graphService.resolveNeo4jInt(varNode.uid));
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
          }
        },
      );
    });
    return Object.values(result);
  }

  private isTempUID(uid: number): boolean {
    return uid >= 1 && uid <= 99;
  }
}
