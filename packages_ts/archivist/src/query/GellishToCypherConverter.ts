import { Injectable, Logger } from '@nestjs/common';
import { Fact } from '@relica/types';
import { CacheService } from '../cache/cache.service';

interface TempEntity {
  varName: string;
  constraints: string[];
}

@Injectable()
export class GellishToCypherConverter {
  private tempEntities: Map<string, TempEntity> = new Map();
  private readonly logger = new Logger(GellishToCypherConverter.name);

  constructor(private readonly cacheService: CacheService) {}

  async processGellishQuery(
    gellishStatements: Fact[],
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ query: string; params: any }> {
    this.tempEntities.clear();
    const cypherPatterns: string[] = [];
    const params: any = {};
    const whereClauses: string[] = [];

    for (let i = 0; i < gellishStatements.length; i++) {
      const { pattern, stmtParams, whereClause } =
        await this.generateCypherPattern(gellishStatements[i], i);
      cypherPatterns.push(pattern);
      Object.assign(params, stmtParams);
      if (whereClause) whereClauses.push(whereClause);
    }

    this.logger.debug('Cypher Patterns:\n' + cypherPatterns.join('\n'));

    const skip = (page - 1) * pageSize;
    const limit = pageSize;

    const query = this.generateCypherQuery(
      cypherPatterns,
      whereClauses,
      gellishStatements.length,
      skip,
      limit,
    );

    this.logger.debug('Generated Cypher Query:\n' + query);
    this.logger.debug('Query Params:', params);

    return { query, params };
  }

  private async generateCypherPattern(
    statement: Fact,
    index: number,
  ): Promise<{ pattern: string; stmtParams: any; whereClause: string }> {
    const lhVar = this.getEntityVariable(statement.lh_object_uid);
    const rhVar = this.getEntityVariable(statement.rh_object_uid);
    const fVar = `f${index}`;
    const stmtParams: any = {};
    const whereClauses: string[] = [];

    const lhIsTemp = this.isTempUID(statement.lh_object_uid);
    const rhIsTemp = this.isTempUID(statement.rh_object_uid);
    const relIsTemp = this.isTempUID(statement.rel_type_uid);

    if (!lhIsTemp) {
      const lhDescendants = await this.cacheService.allDescendantsOf(
        statement.lh_object_uid,
      );
      stmtParams[`${lhVar}Descendants`] = [
        statement.lh_object_uid,
        ...lhDescendants,
      ];
      whereClauses.push(`${lhVar}.uid IN $${lhVar}Descendants`);
    }

    if (!rhIsTemp) {
      const rhDescendants = await this.cacheService.allDescendantsOf(
        statement.rh_object_uid,
      );
      stmtParams[`${rhVar}Descendants`] = [
        statement.rh_object_uid,
        ...rhDescendants,
      ];
      whereClauses.push(`${rhVar}.uid IN $${rhVar}Descendants`);
    }

    if (!relIsTemp) {
      const relDescendants = await this.cacheService.allDescendantsOf(
        statement.rel_type_uid,
      );
      stmtParams[`${fVar}Descendants`] = [
        statement.rel_type_uid,
        ...relDescendants,
      ];
      whereClauses.push(`${fVar}.rel_type_uid IN $${fVar}Descendants`);
    }

    const pattern = `MATCH (${lhVar}:Entity)-->(${fVar}:Fact)-->(${rhVar}:Entity)`;

    return { pattern, stmtParams, whereClause: whereClauses.join(' AND ') };
  }

  private getEntityVariable(uid: number): string {
    const varName = `var_${uid}`;
    if (!this.tempEntities.has(varName)) {
      this.tempEntities.set(varName, { varName, constraints: [] });
    }
    return varName;
  }

  private generateCypherQuery(
    patterns: string[],
    whereClauses: string[],
    statementCount: number,
    skip: number,
    limit: number,
  ): string {
    const matchClauses = patterns.join('\n');
    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const returnClause = this.generateReturnClause(statementCount);

    return `
    ${matchClauses}
    ${whereClause}
    ${returnClause}
    SKIP ${skip}
    LIMIT ${limit}
  `;
  }

  private generateReturnClause(statementCount: number): string {
    const returnItems = Array.from(this.tempEntities.values()).map(
      (entity) => `${entity.varName} {.*, uid: ${entity.varName}.uid}`,
    );
    const factItems = Array(statementCount)
      .fill(0)
      .map((_, i) => `f${i}`);
    return `RETURN DISTINCT ${returnItems.join(', ')}, ${factItems.join(', ')}`;
  }

  private isTempUID(uid: number): boolean {
    return uid >= 1 && uid <= 99;
  }
}
