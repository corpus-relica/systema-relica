import { Module } from '@nestjs/common';
import { BasisCoreService } from './core.service';
import { BasisConeService } from './cone.service';
import { BasisLineageService } from './lineage.service';
import { BasisRelationService } from './relation.service';
import { GraphService } from '../graph/graph.service';
import { CacheService } from '../cache/cache.service';
// Note: GraphService and CacheService are imported directly as services

@Module({
  imports: [],
  providers: [
    BasisCoreService,
    BasisConeService,
    BasisLineageService,
    BasisRelationService,
    GraphService,
    CacheService,
  ],
  exports: [
    BasisCoreService,
    BasisConeService,
    BasisLineageService,
    BasisRelationService,
  ],
})
export class BasisModule {}