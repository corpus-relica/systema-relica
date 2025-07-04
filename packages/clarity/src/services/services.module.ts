import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArchivistModule } from '../archivist/archivist.module';
import { EntityModelService } from './entity-model.service';
import { PhysicalObjectModelService } from './physical-object-model.service';
import { AspectModelService } from './aspect-model.service';
import { RoleModelService } from './role-model.service';
import { RelationModelService } from './relation-model.service';
import { OccurrenceModelService } from './occurrence-model.service';
import { SemanticModelService } from './semantic-model.service';

@Module({
  imports: [ConfigModule, ArchivistModule],
  providers: [
    EntityModelService,
    PhysicalObjectModelService,
    AspectModelService,
    RoleModelService,
    RelationModelService,
    OccurrenceModelService,
    SemanticModelService,
  ],
  exports: [
    EntityModelService,
    PhysicalObjectModelService,
    AspectModelService,
    RoleModelService,
    RelationModelService,
    OccurrenceModelService,
    SemanticModelService,
  ],
})
export class ServicesModule {}
