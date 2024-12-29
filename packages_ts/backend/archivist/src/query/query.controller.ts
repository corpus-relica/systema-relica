import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiOperation, ApiBody } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { QueryService } from './query.service.js';
import { GellishBaseService } from '../gellish-base/gellish-base.service.js';
import { Fact } from '@relica/types';
import { QueryStringDto } from './queryString.dto.js';

@ApiTags('Query')
@Controller('query')
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
    return this.queryService.interpretQueryTable(queryTable, 1, 10);
  }

  @Post('queryString')
  @ApiOperation({ summary: 'Process a Gellish query string' })
  @ApiBody({ type: QueryStringDto })
  async handleGellishQueryString(@Body() body: QueryStringDto): Promise<any> {
    const { queryString, page, pageSize } = body;
    return this.queryService.interpretQueryString(queryString, page, pageSize);
  }
}
