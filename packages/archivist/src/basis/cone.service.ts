import { Injectable, Logger } from '@nestjs/common';
import { BasisCoreService } from './core.service';

@Injectable()
export class BasisConeService {
  private readonly logger = new Logger(BasisConeService.name);

  constructor(private readonly basisCore: BasisCoreService) {}

  /**
   * Get subtype concepts of a given entity
   * Returns a set of facts
   */
  async getSubtypes(uid: number): Promise<any[]> {
    return this.basisCore.getRelations(uid, {
      direction: 'incoming',
      edgeType: 1146
    });
  }

  /**
   * Get subtype concepts recursively to distance n
   * Returns a set of uids
   */
  async getSubtypesRecursive(uid: number, maxDepth: number): Promise<any[]> {
    const result = await this.basisCore.getRelationsRecursive(uid, {
      direction: 'incoming',
      edgeType: 1146,
      maxDepth
    });
    return result.facts;
  }

  /**
   * Compute descendants from input node
   * Returns set of uids
   */
  async calculateCone(uid: number): Promise<number[]> {
    const subtypeRels = await this.getSubtypesRecursive(uid, 100);
    console.log(`Found ${subtypeRels.length} subtype relations`);
    
    const subtypeUids = new Set(subtypeRels.map(rel => rel.lh_object_uid));
    return Array.from(subtypeUids);
  }

  /**
   * Get the set of all descendants of input entity
   * Returns set of uids
   */
  async getCone(uid: number): Promise<number[]> {
    return this.basisCore.expandTypes([uid]);
  }
}