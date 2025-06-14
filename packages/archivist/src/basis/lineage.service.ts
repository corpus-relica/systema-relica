import { Injectable, Logger } from '@nestjs/common';
import { BasisCoreService } from './core.service';

@Injectable()
export class BasisLineageService {
  private readonly logger = new Logger(BasisLineageService.name);

  constructor(private readonly basisCore: BasisCoreService) {}

  /**
   * Get supertype concepts of a given entity
   * Returns a set of facts
   */
  async getSupertypes(uid: number): Promise<any[]> {
    return this.basisCore.getRelations(uid, {
      direction: 'outgoing',
      edgeType: 1146
    });
  }

  /**
   * Get supertype concepts recursively to distance n
   * Returns a set of facts
   */
  async getSupertypesRecursive(uid: number, maxDepth: number): Promise<any[]> {
    const result = await this.basisCore.getRelationsRecursive(uid, {
      direction: 'outgoing',
      edgeType: 1146,
      maxDepth
    });
    return result.facts;
  }

  /**
   * Calculate complete paths from node to root
   * Returns set of uids
   */
  async calculateLineage(uid: number): Promise<number[]> {
    const supertypeRels = await this.getSupertypesRecursive(uid, 100);
    console.log(`Found ${supertypeRels.length} supertype relations`);
    
    const supertypeUids = new Set(supertypeRels.map(rel => rel.rh_object_uid));
    return Array.from(supertypeUids);
  }

  /**
   * Get ordered list of ancestors
   * Returns lineage path as array of uids
   */
  async getLineage(uid: number): Promise<number[]> {
    return this.calculateLineage(uid);
  }

  /**
   * Find closest common ancestor between two entities
   */
  async findCommonAncestor(uid1: number, uid2: number): Promise<number | null> {
    const lineage1 = await this.getLineage(uid1);
    const lineage2 = await this.getLineage(uid2);
    
    const set1 = new Set(lineage1);
    const commonAncestors = lineage2.filter(uid => set1.has(uid));
    
    return commonAncestors.length > 0 ? commonAncestors[0] : null;
  }
}