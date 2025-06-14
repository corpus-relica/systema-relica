import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Neo4jService } from './neo4j.service';
import { PostgresService } from './postgres.service';

@Global()
@Module({
  providers: [Neo4jService, PostgresService],
  exports: [Neo4jService, PostgresService],
})
export class DatabaseModule {}