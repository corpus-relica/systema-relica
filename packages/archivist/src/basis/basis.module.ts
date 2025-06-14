import { Module } from '@nestjs/common';
import { BasisCoreService } from './core.service';
import { BasisConeService } from './cone.service';
import { BasisLineageService } from './lineage.service';
import { BasisRelationService } from './relation.service';
import { GraphModule } from '../graph/graph.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [GraphModule, CacheModule],
  providers: [
    BasisCoreService,
    BasisConeService,
    BasisLineageService,
    BasisRelationService,
  ],
  exports: [
    BasisCoreService,
    BasisConeService,
    BasisLineageService,
    BasisRelationService,
  ],
})
export class BasisModule {}