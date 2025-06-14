import { Injectable, Logger } from '@nestjs/common';
import { GraphService } from '../graph/graph.service';
import { TraversalConfig, TraversalResult, FactSetResult, SetOperation } from './types';

@Injectable()
export class BasisCoreService {
  private readonly logger = new Logger(BasisCoreService.name);

  constructor(private readonly graphService: GraphService) {}

  async getRelations(
    uid: number,
    config: TraversalConfig = {}
  ): Promise<any[]> {
    const {
      direction = 'outgoing',
      edgeType,
      includeSubtypes = false,
      filterFn
    } = config;

    this.logger.debug(`Getting relations for UID ${uid} with direction ${direction}`);

    let query = '';
    let params: any = { uid };

    switch (direction) {
      case 'outgoing':
        query = `
          MATCH (n {fact_uid: $uid})-[r]->(m)
          ${this._buildEdgeTypeFilter('r', edgeType, includeSubtypes)}
          RETURN n, r, m, r.fact_uid as fact_uid
        `;
        break;
      case 'incoming':
        query = `
          MATCH (m)-[r]->(n {fact_uid: $uid})
          ${this._buildEdgeTypeFilter('r', edgeType, includeSubtypes)}
          RETURN n, r, m, r.fact_uid as fact_uid
        `;
        break;
      case 'both':
        query = `
          MATCH (n {fact_uid: $uid})-[r]-(m)
          ${this._buildEdgeTypeFilter('r', edgeType, includeSubtypes)}
          RETURN n, r, m, r.fact_uid as fact_uid
        `;
        break;
    }

    if (edgeType) {
      if (Array.isArray(edgeType)) {
        params.edgeTypes = edgeType;
      } else {
        params.edgeType = edgeType;
      }
    }

    const result = await this.graphService.read(query, params);
    let facts = result.records.map(record => ({
      fact_uid: record.get('fact_uid'),
      lh_object_uid: record.get('n').properties.fact_uid,
      rh_object_uid: record.get('m').properties.fact_uid,
      rel_type_uid: record.get('r').type,
      // Additional properties from the relationship
      ...record.get('r').properties
    }));

    if (filterFn) {
      facts = facts.filter(filterFn);
    }

    return facts;
  }

  async getRelationsRecursive(
    uid: number,
    config: TraversalConfig = {}
  ): Promise<TraversalResult> {
    const {
      maxDepth = 10,
      direction = 'outgoing',
      filterFn
    } = config;

    const visited = new Set<number>();
    const allFacts: any[] = [];
    const queue: Array<{ uid: number; depth: number; path: number[] }> = [
      { uid, depth: 0, path: [uid] }
    ];

    while (queue.length > 0) {
      const { uid: currentUid, depth, path } = queue.shift()!;

      if (depth >= maxDepth || visited.has(currentUid)) {
        continue;
      }

      visited.add(currentUid);

      const facts = await this.getRelations(currentUid, {
        ...config,
        filterFn: undefined // Apply filter at the end
      });

      for (const fact of facts) {
        const nextUid = direction === 'incoming' 
          ? fact.lh_object_uid 
          : fact.rh_object_uid;

        if (!visited.has(nextUid)) {
          queue.push({
            uid: nextUid,
            depth: depth + 1,
            path: [...path, nextUid]
          });
        }

        allFacts.push({ ...fact, depth, path });
      }
    }

    let filteredFacts = allFacts;
    if (filterFn) {
      filteredFacts = allFacts.filter(filterFn);
    }

    return {
      facts: filteredFacts,
      depth: Math.max(...allFacts.map(f => f.depth)),
      path: []
    };
  }

  async expandTypes(typeUids: number[]): Promise<number[]> {
    if (typeUids.length === 0) return [];

    const query = `
      MATCH (subtype)-[:specialization]->(supertype)
      WHERE supertype.fact_uid IN $typeUids
      RETURN DISTINCT subtype.fact_uid as subtype_uid
    `;

    const result = await this.graphService.read(query, { typeUids });
    const subtypes = result.records.map(record => record.get('subtype_uid'));

    return [...typeUids, ...subtypes];
  }

  factSetOperation(
    factSets: any[][],
    operation: SetOperation,
    keyFn: (fact: any) => string = (fact) => fact.fact_uid?.toString()
  ): FactSetResult {
    if (factSets.length === 0) {
      return {
        facts: [],
        operation_applied: operation,
        source_sets: 0
      };
    }

    if (factSets.length === 1) {
      return {
        facts: factSets[0],
        operation_applied: operation,
        source_sets: 1
      };
    }

    let result = factSets[0];

    for (let i = 1; i < factSets.length; i++) {
      const currentSet = factSets[i];

      switch (operation) {
        case 'union':
          result = this._unionFacts(result, currentSet, keyFn);
          break;
        case 'intersection':
          result = this._intersectionFacts(result, currentSet, keyFn);
          break;
        case 'difference':
          result = this._differenceFacts(result, currentSet, keyFn);
          break;
      }
    }

    return {
      facts: result,
      operation_applied: operation,
      source_sets: factSets.length
    };
  }

  private _buildEdgeTypeFilter(
    relationVar: string,
    edgeType?: number | number[],
    includeSubtypes?: boolean
  ): string {
    if (!edgeType) return '';

    if (Array.isArray(edgeType)) {
      return `WHERE ${relationVar}.rel_type_uid IN $edgeTypes`;
    } else {
      const baseFilter = `WHERE ${relationVar}.rel_type_uid = $edgeType`;
      
      if (includeSubtypes) {
        return `${baseFilter} OR ${relationVar}.rel_type_uid IN [/* subtypes of edgeType */]`;
      }
      
      return baseFilter;
    }
  }

  private _unionFacts(
    set1: any[],
    set2: any[],
    keyFn: (fact: any) => string
  ): any[] {
    const keySet = new Set(set1.map(keyFn));
    const result = [...set1];

    for (const fact of set2) {
      if (!keySet.has(keyFn(fact))) {
        result.push(fact);
        keySet.add(keyFn(fact));
      }
    }

    return result;
  }

  private _intersectionFacts(
    set1: any[],
    set2: any[],
    keyFn: (fact: any) => string
  ): any[] {
    const keySet2 = new Set(set2.map(keyFn));
    return set1.filter(fact => keySet2.has(keyFn(fact)));
  }

  private _differenceFacts(
    set1: any[],
    set2: any[],
    keyFn: (fact: any) => string
  ): any[] {
    const keySet2 = new Set(set2.map(keyFn));
    return set1.filter(fact => !keySet2.has(keyFn(fact)));
  }
}