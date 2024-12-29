import {
  Controller,
  Get,
  Query,
  Inject,
  Param,
  Logger,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { KindsService } from './kinds.service.js';

@Controller('kinds')
export class KindsController {
  private readonly logger = new Logger(KindsController.name);

  constructor(private readonly kindsService: KindsService) {}

  @Get()
  async getKinds(
    @Query('sort') sort: string,
    @Query('range') range: string,
    @Query('filter') filter: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const [sortField, sortOrder] = JSON.parse(sort);
    const [minRange, maxRange] = JSON.parse(range);
    const skip = minRange;
    const take = maxRange - minRange;

    const result = await this.kindsService.getList(
      sortField,
      sortOrder,
      skip,
      take,
    );

    res.header(
      'Content-Range',
      `posts ${minRange}-${maxRange}/${result.total}`,
    );

    return result;
  }
}
