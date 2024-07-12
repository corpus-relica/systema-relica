import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { QueryService } from './query.service';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';
import { Fact } from '@relica/types';

@ApiTags('Query')
@Controller('qeury')
export class QueryController {
  private readonly logger = new Logger(QueryController.name);

  constructor(
    private readonly queryService: QueryService,
    private readonly gellishBaseService: GellishBaseService,
  ) {}

  @Post('query')
  async handleGellishQuery(
    @Body() queryTable: Fact[], //GellishTable,
  ): Promise<any> {
    // Process the query and return results
    return this.queryService.handleGellishQuery(queryTable);
  }
}
