import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiOperation, ApiBody } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { QueryService } from './query.service';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';
import { Fact } from '@relica/types';
import { QueryStringDto } from './queryString.dto';

import { GellishParser } from './GellishParser2';

@ApiTags('Query')
@Controller('query')
export class QueryController {
  private readonly logger = new Logger(QueryController.name);
  private readonly parser = new GellishParser();

  constructor(
    private readonly queryService: QueryService,
    private readonly gellishBaseService: GellishBaseService,
  ) {}

  @Post('query')
  async handleGellishQuery(
    @Body() queryTable: Fact[], //GellishTable,
  ): Promise<any> {
    // Process the query and return results
    return this.queryService.interpretTable(queryTable, 1, 10);
  }

  @Post('queryString')
  @ApiOperation({ summary: 'Process a Gellish query string' })
  @ApiBody({ type: QueryStringDto })
  async handleGellishQueryString(@Body() body: QueryStringDto): Promise<any> {
    const { queryString, page, pageSize } = body;
    // Process the query and return results
    const queryStringArray: string[] = queryString.split('\n');

    let qStr = '';
    let finalArray = [];
    queryStringArray.forEach((queryString) => {
      qStr += queryString + '\n';
      if (!queryString.startsWith('@')) {
        finalArray.push(qStr);
        qStr = '';
      }
    });

    const queryTable = finalArray.reduce(
      (memo, queryString) => memo.concat(this.parser.parse(queryString)),
      [],
    );

    const result = await this.queryService.interpretTable(
      queryTable,
      page,
      pageSize,
    );
    return result;
    // return queryTable;
  }
}
