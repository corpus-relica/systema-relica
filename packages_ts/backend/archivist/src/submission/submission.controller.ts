import { Controller, Put, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubmissionService } from './submission.service.js';
import { GellishBaseService } from '../gellish-base/gellish-base.service.js';
import { CacheService } from '../cache/cache.service.js';
import {
  UpdateCollectionDto,
  CreateDateDto,
  UpdateNameDto,
  AddSynonymDto,
  BlanketRenameDto,
} from './submission.dto.js';

@ApiTags('Submission')
@Controller('submission')
export class SubmissionController {
  private readonly logger = new Logger(SubmissionController.name);

  constructor(
    private readonly submissionService: SubmissionService,
    private readonly gellishBaseService: GellishBaseService,
    private readonly cacheService: CacheService,
  ) {}

  @Put('/definition')
  async updateDefinition(@Body() body) {
    const { fact_uid, partial_definition, full_definition } = body;
    const result = await this.gellishBaseService.updateFactDefinition(
      +fact_uid,
      partial_definition,
      full_definition,
    );
    return result;
  }

  @Put('/collection')
  @ApiOperation({ summary: 'Update a collection' })
  @ApiResponse({ status: 200, description: 'Collection updated successfully.' })
  @ApiResponse({ status: 500, description: 'Something went wrong.' })
  async updateCollection(@Body() body: UpdateCollectionDto) {
    const { fact_uid, collection_uid, collection_name } = body;
    const result = await this.gellishBaseService.updateFactCollection(
      +fact_uid,
      +collection_uid,
      collection_name,
    );
    return result;
  }

  @Put('/name')
  @ApiOperation({ summary: 'Update entity name on the fact with fact_uid' })
  @ApiResponse({
    status: 200,
    description: 'Entity name updated successfully.',
  })
  @ApiResponse({ status: 500, description: 'Something went wrong.' })
  async updateName(@Body() body: UpdateNameDto) {
    const { fact_uid, name } = body;
    const result = await this.gellishBaseService.updateFactName(
      +fact_uid,
      name,
    );
    return result;
  }

  @Put('/blanketRename')
  @ApiOperation({
    summary: 'Update entity name at every instance of entity_uid',
  })
  @ApiResponse({
    status: 200,
    description: 'Entity name updated successfully.',
  })
  @ApiResponse({ status: 500, description: 'Something went wrong.' })
  async blanketRename(@Body() body: BlanketRenameDto) {
    const { entity_uid, name } = body;
    const result = await this.gellishBaseService.blanketUpdateFactName(
      +entity_uid,
      name,
    );
    return result;
  }

  @Post('/synonym')
  @ApiOperation({ summary: 'Add entity synonym' })
  @ApiResponse({
    status: 200,
    description: 'Entity synony added successfully.',
  })
  @ApiResponse({ status: 500, description: 'Something went wrong.' })
  async addSynonym(@Body() body: AddSynonymDto) {
    const { uid, synonym } = body;
    // const result = await this.gellishBaseService.addSynonym(+uid, synonym);
    // return result;
    return { uid, synonym };
  }

  @Post('/date')
  @ApiOperation({ summary: 'Create Date' })
  @ApiResponse({ status: 200, description: 'Date created successfully.' })
  @ApiResponse({ status: 500, description: 'Something went wrong.' })
  async createDate(@Body() body: CreateDateDto) {
    const { date_uid, collection_uid, collection_name } = body;
    const result = await this.submissionService.submitDate({
      lh_object_uid: +date_uid,
      lh_object_name: '' + date_uid,
      rel_type_uid: +1225,
      rel_type_name: 'is classified as',
      rh_object_uid: +550571,
      rh_object_name: 'date',
      collection_uid: +collection_uid,
      collection_name,
    });
    return result;
  }
}
