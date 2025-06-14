import { Injectable, Logger } from '@nestjs/common';
import { GraphService } from '../graph/graph.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class BasisCoreService {
  private readonly logger = new Logger(BasisCoreService.name);

  constructor(
    private readonly graphService: GraphService,
    private readonly cacheService: CacheService
  ) {}

  // Core queries - direct translation from Clojure
  private async relatedFacts(startUid: number): Promise<any[]> {
    const query = `
      MATCH (start:Entity)--(r)-->(end:Entity)
      WHERE start.uid = $start_uid
      RETURN r
    `;
    const result = await this.graphService.read(query, { start_uid: startUid });
    return this.graphService.transformResults(result);
  }

  private async relatedFactsIn(startUid: number, relTypeUids: number[]): Promise<any[]> {
    const query = `
      MATCH (start:Entity)--(r)-->(end:Entity)
      WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
      RETURN r
    `;
    const result = await this.graphService.read(query, { start_uid: startUid, rel_type_uids: relTypeUids });
    return this.graphService.transformResults(result);
  }

  private async relatedFactsReverse(startUid: number): Promise<any[]> {
    const query = `
      MATCH (start:Entity)<--(r)--(end:Entity)
      WHERE start.uid = $start_uid
      RETURN r
    `;
    const result = await this.graphService.read(query, { start_uid: startUid });
    return this.graphService.transformResults(result);
  }

  private async relatedFactsReverseIn(startUid: number, relTypeUids: number[]): Promise<any[]> {
    const query = `
      MATCH (start:Entity)<--(r)--(end:Entity)
      WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
      RETURN r
    `;
    const result = await this.graphService.read(query, { start_uid: startUid, rel_type_uids: relTypeUids });
    return this.graphService.transformResults(result);
  }

  /**
   * Expand a type or collection of types to include subtypes
   */
  async expandTypes(edgeTypes: number | number[]): Promise<number[]> {
    try {
      const types = Array.isArray(edgeTypes) ? edgeTypes : [edgeTypes];
      const allTypes = new Set<number>();
      
      for (const type of types) {
        const descendants = await this.cacheService.allDescendantsOf(type);
        allTypes.add(type);
        descendants.forEach(d => allTypes.add(d));
      }
      
      return Array.from(allTypes);
    } catch (error) {
      return Array.isArray(edgeTypes) ? edgeTypes : [edgeTypes];
    }
  }

  /**
   * Deduplicate facts by fact_uid
   */
  private dedupeFacts(facts: any[]): any[] {
    const factMap = new Map();
    facts.forEach(fact => {
      factMap.set(fact.fact_uid, fact);
    });
    return Array.from(factMap.values());
  }

  /**
   * Get direct relations matching params.
   * Returns sequence of facts.
   */
  async getRelations(uid: number, config: {
    direction?: 'outgoing' | 'incoming' | 'both';
    edgeType?: number | number[];
    includeSubtypes?: boolean;
  } = {}): Promise<any[]> {
    try {
      const {
        direction = 'both',
        edgeType,
        includeSubtypes = true
      } = config;

      let relTypes: number[] | undefined;
      if (edgeType) {
        relTypes = includeSubtypes 
          ? await this.expandTypes(edgeType)
          : (Array.isArray(edgeType) ? edgeType : [edgeType]);
      }

      let results: any[];
      
      switch (direction) {
        case 'outgoing':
          results = relTypes 
            ? await this.relatedFactsIn(uid, relTypes)
            : await this.relatedFacts(uid);
          break;
        case 'incoming':
          results = relTypes
            ? await this.relatedFactsReverseIn(uid, relTypes)
            : await this.relatedFactsReverse(uid);
          break;
        case 'both':
          const outgoing = relTypes 
            ? await this.relatedFactsIn(uid, relTypes)
            : await this.relatedFacts(uid);
          const incoming = relTypes
            ? await this.relatedFactsReverseIn(uid, relTypes)
            : await this.relatedFactsReverse(uid);
          results = [...outgoing, ...incoming];
          break;
        default:
          results = [];
      }

      return results;
    } catch (error) {
      this.logger.error(`Error in getRelations: ${error.message}`);
      return [];
    }
  }

  /**
   * Recursive relation traversal with cycle detection.
   * Returns sequence of facts.
   */
  async getRelationsRecursive(uid: number, config: {
    direction?: 'outgoing' | 'incoming' | 'both';
    edgeType?: number | number[];
    includeSubtypes?: boolean;
    maxDepth?: number;
  } = {}): Promise<any[]> {
    try {
      const {
        direction = 'both',
        edgeType,
        includeSubtypes = true,
        maxDepth = 1
      } = config;

      const visited = new Set<number>();
      const allFacts: any[] = [];

      const getRelated = async (currentUid: number): Promise<any[]> => {
        return this.getRelations(currentUid, {
          direction,
          edgeType,
          includeSubtypes
        });
      };

      const traverse = async (currentUid: number, currentDepth: number): Promise<void> => {
        if (currentDepth >= maxDepth || visited.has(currentUid)) {
          return;
        }

        visited.add(currentUid);
        const relations = await getRelated(currentUid);
        allFacts.push(...relations);

        const nextUids = relations.map(fact => {
          switch (direction) {
            case 'outgoing':
              return fact.rh_object_uid;
            case 'incoming':
              return fact.lh_object_uid;
            case 'both':
              return currentUid === fact.lh_object_uid 
                ? fact.rh_object_uid 
                : fact.lh_object_uid;
            default:
              return null;
          }
        }).filter(uid => uid !== null);

        // Continue recursion
        for (const nextUid of nextUids) {
          await traverse(nextUid, currentDepth + 1);
        }
      };

      // Start traversal
      await traverse(uid, 0);

      // Return deduplicated results
      return this.dedupeFacts(allFacts);
    } catch (error) {
      this.logger.error(`Error in getRelationsRecursive: ${error.message}`);
      return [];
    }
  }

  /**
   * Get direct relations matching params and filter function.
   * Returns sequence of filtered facts.
   */
  async getRelationsFiltered(uid: number, config: {
    direction?: 'outgoing' | 'incoming' | 'both';
    edgeType?: number | number[];
    includeSubtypes?: boolean;
    filterFn: (fact: any) => boolean;
  }): Promise<any[]> {
    try {
      const { filterFn, ...relationsConfig } = config;
      const relations = await this.getRelations(uid, relationsConfig);
      return relations.filter(filterFn);
    } catch (error) {
      this.logger.error(`Error in getRelationsFiltered: ${error.message}`);
      return [];
    }
  }

  /**
   * Recursive filtered relation traversal with cycle detection.
   * Returns sequence of filtered facts.
   */
  async getRelationsFilteredRecursive(uid: number, config: {
    direction?: 'outgoing' | 'incoming' | 'both';
    edgeType?: number | number[];
    includeSubtypes?: boolean;
    maxDepth?: number;
    filterFns: ((fact: any) => boolean) | ((fact: any) => boolean)[];
  }): Promise<any[]> {
    try {
      const {
        direction = 'both',
        edgeType,
        includeSubtypes = true,
        maxDepth = 10,
        filterFns
      } = config;

      const visited = new Set<number>();
      const allFacts: any[] = [];
      const fnsArray = Array.isArray(filterFns) ? filterFns : [filterFns];
      let filterCount = 0;

      const getRelated = async (currentUid: number): Promise<any[]> => {
        const relations = await this.getRelations(currentUid, {
          direction,
          edgeType,
          includeSubtypes
        });

        const filtered = relations.filter(fact => {
          const filterFn = fnsArray[filterCount % fnsArray.length];
          const result = filterFn(fact);
          if (result) {
            filterCount++;
          }
          return result;
        });

        return filtered;
      };

      const traverse = async (currentUid: number, currentDepth: number): Promise<void> => {
        if (currentDepth >= maxDepth || visited.has(currentUid)) {
          return;
        }

        visited.add(currentUid);
        const relations = await getRelated(currentUid);
        allFacts.push(...relations);

        const nextUids = relations.map(fact => {
          switch (direction) {
            case 'outgoing':
              return fact.rh_object_uid;
            case 'incoming':
              return fact.lh_object_uid;
            case 'both':
              return currentUid === fact.lh_object_uid 
                ? fact.rh_object_uid 
                : fact.lh_object_uid;
            default:
              return null;
          }
        }).filter(uid => uid !== null);

        // Continue recursion
        for (const nextUid of nextUids) {
          await traverse(nextUid, currentDepth + 1);
        }
      };

      // Start traversal
      await traverse(uid, 0);

      // Return deduplicated results
      return this.dedupeFacts(allFacts);
    } catch (error) {
      this.logger.error(`Error in getRelationsFilteredRecursive: ${error.message}`);
      return [];
    }
  }

  /**
   * Apply set operation to two collections of facts.
   */
  binaryFactSetOp(
    op: 'union' | 'intersection' | 'difference',
    facts1: any[],
    facts2: any[],
    key1: string = 'fact_uid',
    key2: string = 'fact_uid'
  ): Set<any> {
    const set1 = new Set(facts1.map(fact => fact[key1]));
    const set2 = new Set(facts2.map(fact => fact[key2]));

    switch (op) {
      case 'union':
        return new Set([...set1, ...set2]);
      case 'intersection':
        return new Set([...set1].filter(x => set2.has(x)));
      case 'difference':
        return new Set([...set1].filter(x => !set2.has(x)));
      default:
        return new Set();
    }
  }

  /**
   * Apply sequence of set operations to multiple collections of facts.
   */
  factSetOp(
    ops: string | string[],
    factColls: any[][],
    keys: string | string[] | [string, string][]
  ): Set<any> {
    // Normalize inputs to sequences
    const opsSeq = Array.isArray(ops) ? ops : Array(factColls.length - 1).fill(ops);
    
    let keysSeq: [string, string][];
    if (typeof keys === 'string') {
      keysSeq = Array(factColls.length - 1).fill([keys, keys]);
    } else if (Array.isArray(keys) && typeof keys[0] === 'string') {
      // Make pairs cycling through the array
      const keyPairs: [string, string][] = [];
      for (let i = 0; i < factColls.length - 1; i++) {
        const key1 = keys[i % keys.length] as string;
        const key2 = keys[(i + 1) % keys.length] as string;
        keyPairs.push([key1, key2]);
      }
      keysSeq = keyPairs;
    } else {
      keysSeq = keys as [string, string][];
    }

    // Apply operations sequentially
    const [firstColl, ...restColls] = factColls;
    
    return restColls.reduce((acc, coll, index) => {
      const op = opsSeq[index % opsSeq.length] as 'union' | 'intersection' | 'difference';
      const [key1, key2] = keysSeq[index % keysSeq.length];
      
      // Convert Set back to array for binaryFactSetOp, then back to Set
      const accArray = Array.from(acc).map(val => ({ [key1]: val }));
      return this.binaryFactSetOp(op, accArray, coll, key1, key2);
    }, new Set(firstColl.map(fact => fact[typeof keys === 'string' ? keys : 'fact_uid'])));
  }
}