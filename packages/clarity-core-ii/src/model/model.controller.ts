import {
  Controller,
  Get,
  Put,
  Post,
  Query,
  Body,
  Inject,
  Param,
  Logger,
  Res,
  HttpException,
} from '@nestjs/common';
import { ModelService } from './model.service';

@Controller('model')
export class ModelController {
  private readonly logger = new Logger(ModelController.name);

  constructor(private readonly modelService: ModelService) {}

  @Get('/kind')
  async kind(@Query('uid') uid: string) {
    if (uid === undefined) {
      throw new HttpException('No UID provided', 400);
    } else {
      const result = await this.modelService.retrieveKindModel(+uid);
      return result;
    }
  }

  @Get('/individual')
  async individual(@Query('uid') uid: string) {
    if (uid === undefined) {
      throw new HttpException('No UID provided', 400);
    } else {
      const result = await this.modelService.retrieveIndividualModel(+uid);
      return result;
    }
  }

  @Get()
  async model(@Query('uid') uid: string, @Query('uids') uids: number[]) {
    if (uid !== undefined) {
      const result = await this.modelService.retrieveModel(+uid);
      return result;
    } else if (uids !== undefined) {
      let parsedUIDs;
      if (typeof uids === 'string') {
        parsedUIDs = JSON.parse(uids);
      } else if (Array.isArray(uids)) {
        parsedUIDs = uids;
      }
      const result = await this.modelService.retrieveModels(parsedUIDs);
      return result;
    } else {
      throw new HttpException(
        'error attempting to retrieveModel(s). neither parameter UID nor UIDs is defined',
        400,
      );
    }
  }

  @Put('/definition')
  async definition(
    @Body()
    body: any,
  ) {
    const { fact_uid, partial_definition, full_definition } = body;
    if (
      fact_uid === undefined ||
      partial_definition === undefined ||
      full_definition === undefined
    ) {
      throw new HttpException(
        'fact_uid or partial_definition or full_definition not provided',
        400,
      );
    } else {
      const result = await this.modelService.updateDefinition(
        +fact_uid,
        partial_definition,
        full_definition,
      );
      return result;
    }
  }

  @Put('/collection')
  async collection(
    @Body('fact_uid') fact_uid: string,
    @Body('collection_uid') collection_uid: string,
    @Body('collection_name') collection_name: string,
  ) {
    if (
      fact_uid === undefined ||
      collection_uid === undefined ||
      collection_name === undefined
    ) {
      throw new HttpException(
        'fact_uid or collection_uid or collection_name not provided',
        400,
      );
    } else {
      const result = await this.modelService.updateCollection(
        +fact_uid,
        +collection_uid,
        collection_name,
      );
      return result;
    }
  }
}
