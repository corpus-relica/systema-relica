import { Injectable, Logger } from '@nestjs/common';
import { BasisCoreService } from './core.service';
import { BasisLineageService } from './lineage.service';
import { RoleInfo, RelationValidation } from './types';

@Injectable()
export class BasisRelationService {
  private readonly logger = new Logger(BasisRelationService.name);

  constructor(
    private readonly basisCore: BasisCoreService,
    private readonly lineage: BasisLineageService
  ) {}

  /**
   * Find up lineage searching for relation patterns
   */
  async findUpLineage(
    uid: number,
    targetRelationType: number,
    maxDepth: number = 10
  ): Promise<any[]> {
    const lineageRels = await this.lineage.getSupertypesRecursive(uid, maxDepth);
    
    // For each ancestor, check if it has the target relation type
    const results: any[] = [];
    for (const rel of lineageRels) {
      const ancestorUid = rel.rh_object_uid;
      const targetRels = await this.basisCore.getRelations(ancestorUid, {
        edgeType: targetRelationType
      });
      
      for (const targetRel of targetRels) {
        results.push({
          ...targetRel,
          inheritance_distance: rel.depth || 0,
          inherited_from: ancestorUid
        });
      }
    }
    
    return results;
  }

  /**
   * Get required roles for relation types
   * Returns role requirements with inheritance distance
   */
  async getRequiredRoles(relationTypeUid: number): Promise<RoleInfo[]> {
    // Look for relations of type 4731 (can have role) and 4733 (shall have role)
    const roleRels = await this.basisCore.getRelations(relationTypeUid, {
      edgeType: [4731, 4733]
    });

    const roles: RoleInfo[] = [];
    
    for (const rel of roleRels) {
      roles.push({
        role_uid: rel.rh_object_uid,
        required_for_relation: relationTypeUid,
        inheritance_distance: 0,
        can_inherit: rel.rel_type_uid === 4731 // can have role allows inheritance
      });
    }

    // Also check inherited role requirements
    const inheritedRoles = await this.findUpLineage(relationTypeUid, 4731);
    const inheritedRequiredRoles = await this.findUpLineage(relationTypeUid, 4733);

    for (const rel of [...inheritedRoles, ...inheritedRequiredRoles]) {
      roles.push({
        role_uid: rel.rh_object_uid,
        required_for_relation: relationTypeUid,
        inheritance_distance: rel.inheritance_distance,
        can_inherit: rel.rel_type_uid === 4731
      });
    }

    return roles;
  }

  /**
   * Get all roles an entity can play through inheritance
   */
  async getInheritableRoles(uid: number): Promise<RoleInfo[]> {
    // Look for direct role playing relations (type 4714)
    const directRoles = await this.basisCore.getRelations(uid, {
      edgeType: 4714
    });

    const roles: RoleInfo[] = directRoles.map(rel => ({
      role_uid: rel.rh_object_uid,
      required_for_relation: 0, // Will be filled in by caller
      inheritance_distance: 0
    }));

    // Look for inherited role playing capabilities
    const inheritedRoles = await this.findUpLineage(uid, 4714);
    
    for (const rel of inheritedRoles) {
      roles.push({
        role_uid: rel.rh_object_uid,
        required_for_relation: 0,
        inheritance_distance: rel.inheritance_distance
      });
    }

    return roles;
  }

  /**
   * Check role compatibility for relations
   */
  async compatibleRole(entityUid: number, roleUid: number): Promise<boolean> {
    const entityRoles = await this.getInheritableRoles(entityUid);
    return entityRoles.some(role => role.role_uid === roleUid);
  }

  /**
   * Expand facts into explicit role-based form
   */
  async expandBinaryFact(fact: any): Promise<any> {
    const requiredRoles = await this.getRequiredRoles(fact.rel_type_uid);
    
    return {
      ...fact,
      required_roles: requiredRoles,
      lh_roles: await this.getInheritableRoles(fact.lh_object_uid),
      rh_roles: await this.getInheritableRoles(fact.rh_object_uid)
    };
  }

  /**
   * Get relations applicable through inheritance
   */
  async getInheritedRelations(uid: number): Promise<any[]> {
    const lineage = await this.lineage.getLineage(uid);
    const inheritedRels: any[] = [];

    for (const ancestorUid of lineage) {
      const ancestorRels = await this.basisCore.getRelations(ancestorUid, {
        direction: 'both'
      });
      
      for (const rel of ancestorRels) {
        inheritedRels.push({
          ...rel,
          inherited_from: ancestorUid,
          original_entity: uid
        });
      }
    }

    return inheritedRels;
  }

  /**
   * Validate if entities can play required relation roles
   */
  async validateRelationRoles(
    lhUid: number,
    rhUid: number,
    relationTypeUid: number
  ): Promise<RelationValidation> {
    const requiredRoles = await this.getRequiredRoles(relationTypeUid);
    const lhRoles = await this.getInheritableRoles(lhUid);
    const rhRoles = await this.getInheritableRoles(rhUid);

    const lhRoleUids = new Set(lhRoles.map(r => r.role_uid));
    const rhRoleUids = new Set(rhRoles.map(r => r.role_uid));
    
    const missingRoles: number[] = [];
    const incompatibleRoles: number[] = [];

    for (const role of requiredRoles) {
      const canLhPlay = lhRoleUids.has(role.role_uid);
      const canRhPlay = rhRoleUids.has(role.role_uid);
      
      if (!canLhPlay && !canRhPlay) {
        missingRoles.push(role.role_uid);
      }
    }

    const isValid = missingRoles.length === 0 && incompatibleRoles.length === 0;

    return {
      is_valid: isValid,
      missing_roles: missingRoles.length > 0 ? missingRoles : undefined,
      incompatible_roles: incompatibleRoles.length > 0 ? incompatibleRoles : undefined,
      message: isValid ? undefined : `Validation failed: missing roles [${missingRoles.join(', ')}]`
    };
  }
}