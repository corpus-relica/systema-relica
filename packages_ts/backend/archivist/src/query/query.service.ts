import { Injectable, Logger } from '@nestjs/common';
import { GraphService } from '../graph/graph.service.js';
import { GellishBaseService } from '../gellish-base/gellish-base.service.js';
// import { FactService } from '../fact/fact.service';
import { Fact } from '@relica/types';
import { GellishToCypherConverter } from './GellishToCypherConverter.js';
import { GellishParser } from './GellishParser2.js';

import { Record } from 'neo4j-driver';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);
  private readonly parser = new GellishParser();

  constructor(
    private readonly graphService: GraphService,
    // private readonly factService: FactService,
    private readonly gellishBaseService: GellishBaseService,
    private readonly gellishToCypherConverter: GellishToCypherConverter,
  ) {}

  async interpretQueryTable(
    table: Fact[],
    page: number = 1,
    pageSize: number = 10,
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
      this.logger.error('***************************** Cypher Result:', result);
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

  async interpretQueryString(
    queryString: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<any> {
    // Process the query and return results
    const queryStringArray: string[] = queryString.split('\n');

    let qStr = '';
    let finalArray = [];
    queryStringArray.forEach((queryString) => {
      qStr += queryString + '\n';
      if (!queryString.startsWith('@')) {
        finalArray.push(qStr);
        qStr = '';
      }
    });

    const queryTable = finalArray.reduce(
      (memo, queryString) => memo.concat(this.parser.parse(queryString)),
      [],
    );

    this.logger.log('Query Table:', queryTable);

    const result = await this.interpretQueryTable(queryTable, page, pageSize);
    return result;
    // return queryTable;
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
      record.keys.forEach((key: PropertyKey) => {
        if (typeof key === 'string' && key.startsWith('f')) {
          const factNode = record.get(key);
          if (factNode && factNode.properties) {
            const fact = this.graphService.convertNeo4jInts(factNode)
              .properties as Fact;
            const factKey = JSON.stringify(fact);
            if (!uniqueFacts.has(factKey)) {
              uniqueFacts.set(factKey, fact);
            }
          }
        } else if (typeof key === 'string') {
          const varNode = record.get(key);
          if (varNode) {
            const s: Set<number> = variables.get(key) || new Set<number>();
            s.add(this.graphService.resolveNeo4jInt(varNode.uid));
            variables.set(key, s);
          }
        } else {
          console.log('unexpected key type');
          console.log('record:', record);
          console.log('key:', key);
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
