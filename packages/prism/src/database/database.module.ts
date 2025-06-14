import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Neo4jService } from './neo4j.service';

@Global()
@Module({
  providers: [Neo4jService],
  exports: [Neo4jService],
})
export class DatabaseModule {}