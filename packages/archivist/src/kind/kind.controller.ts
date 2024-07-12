import {
  Controller,
  Get,
  Patch,
  Query,
  Inject,
  Param,
  Logger,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { KindService } from './kind.service';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';

@ApiTags('Kind')
@Controller('kind')
export class KindController {
  private readonly logger = new Logger(KindController.name);

  constructor(
    private readonly kindService: KindService,
    private readonly gellishBaseService: GellishBaseService,
  ) {}

  @Get()
  async getKind(
    @Query('uid') uid: string,
    // @Res({ passthrough: true }) res: Response,
  ) {
    console.log(typeof +uid);
    const result = await this.gellishBaseService.getSpecializationFact(+uid);

    // res.header('Content-Range', `posts ${minRange}-${maxRange}/319`);

    return result;
  }

  @Patch('/reparent')
  async reparentKind(
    @Query('uid') uid: string,
    @Query('newParentUid') newParentUid: string,
    @Query('partialDefinition') partialDefinition: string,
    @Query('fullDefinition') fullDefinition: string,
    // @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.kindService.reparentKind(
      +uid,
      +newParentUid,
      partialDefinition,
      fullDefinition,
    );

    // res.header('Content-Range', `posts ${minRange}-${maxRange}/319`);

    return result;
  }
}
