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
import { CacheService } from 'src/cache/cache.service';

@ApiTags('Kind')
@Controller('kind')
export class KindController {
  private readonly logger = new Logger(KindController.name);

  constructor(
    private readonly kindService: KindService,
    private readonly gellishBaseService: GellishBaseService,
    private readonly cacheService: CacheService,
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

  @Patch('/addSupertype')
  async addSupertype(
    @Query('uid') uid: string,
    @Query('name') name: string,
    @Query('newSupertypeUid') newSupertypeUid: string,
    @Query('partialDefinition') partialDefinition: string,
    @Query('fullDefinition') fullDefinition: string,
  ) {
    const result = await this.kindService.addSupertype(
      +uid,
      name,
      +newSupertypeUid,
      partialDefinition,
      fullDefinition,
    );

    return result;
  }

  @Patch('/removeSupertype')
  async removeSupertype(
    @Query('uid') uid: string,
    @Query('supertypeUid') supertypeUid: string,
  ) {
    const result = await this.kindService.removeSupertype(+uid, +supertypeUid);

    return result;
  }

  @Patch('/addParent')
  async addParentToKind(
    @Query('uid') uid: string,
    @Query('name') name: string,
    @Query('newParentUid') newParentUid: string,
    @Query('partialDefinition') partialDefinition: string,
    @Query('fullDefinition') fullDefinition: string,
    // @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.kindService.addParentToKind(
      +uid,
      name,
      +newParentUid,
      partialDefinition,
      fullDefinition,
    );

    // res.header('Content-Range', `posts ${minRange}-${maxRange}/319`);

    return result;
  }

  @Patch('/reparent')
  async reparentKind(
    @Query('uid') uid: string,
    @Query('name') name: string,
    @Query('newParentUid') newParentUid: string,
    @Query('partialDefinition') partialDefinition: string,
    @Query('fullDefinition') fullDefinition: string,
    // @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.kindService.reparentKind(
      +uid,
      name,
      +newParentUid,
      partialDefinition,
      fullDefinition,
    );

    // res.header('Content-Range', `posts ${minRange}-${maxRange}/319`);

    return result;
  }

  @Patch('/xxx')
  async xxx(@Query('euid') euid: string, @Query('luid') luid: string) {
    await this.cacheService.removeEntityFromLineageDescendants(+euid, +luid);
  }
}
