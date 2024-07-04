import {
  Controller,
  Get,
  Put,
  Post,
  Query,
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
  async individual() {
    // const { uid } = req.query;
    // if (uid === undefined) {
    //   res.send('No UID provided');
    // } else {
    //   const result = await retrieveIndividualModel(+uid);
    //   res.send(result);
    // }
  }

  @Get()
  async model() {
    // const { uid, uids } = req.query;
    // if (uid !== undefined) {
    //   const result = await retrieveModel(+uid);
    //   res.send(result);
    // } else if (uids !== undefined) {
    //   let parsedUIDs;
    //   if (typeof uids === 'string') {
    //     parsedUIDs = JSON.parse(uids);
    //   } else if (Array.isArray(uids)) {
    //     parsedUIDs = uids;
    //   }
    //   const result = await retrieveModels(parsedUIDs);
    //   res.send(result);
    // } else {
    //   res.send('UIDs must be an array');
    // }
  }

  @Put('/definition')
  async definition() {
    // const { fact_uid, partial_definition, full_definition } = req.body;
    // if (
    //   fact_uid === undefined ||
    //   partial_definition === undefined ||
    //   full_definition === undefined
    // ) {
    //   res.send(
    //     'fact_uid or partial_definition or full_definition not provided',
    //   );
    // } else {
    //   const result = await updateDefinition(
    //     +fact_uid,
    //     partial_definition,
    //     full_definition,
    //   );
    //   res.send(result);
    // }
  }

  @Put('/collection')
  async collection() {
    // const { fact_uid, collection_uid, collection_name } = req.body;
    // if (
    //   fact_uid === undefined ||
    //   collection_uid === undefined ||
    //   collection_name === undefined
    // ) {
    //   res.send('fact_uid or collection_uid or collection_name not provided');
    // } else {
    //   const result = await updateCollection(
    //     +fact_uid,
    //     +collection_uid,
    //     collection_name,
    //   );
    //   res.send(result);
    // }
  }
}
