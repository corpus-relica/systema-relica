import { Controller, Put, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubmissionService } from './submission.service';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';
import { CacheService } from 'src/cache/cache.service';
import {
  UpdateCollectionDto,
  CreateDateDto,
  UpdateNameDto,
} from './submission.dto';

@ApiTags('Submission')
@Controller('submission')
export class SubmissionController {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly gellishBaseService: GellishBaseService,
    private readonly cacheService: CacheService,
  ) {}

  async updateLineage(descendantUID) {
    const lineage = await this.cacheService.lineageOf(descendantUID);

    await Promise.all(
      lineage.map(async (ancestorUID) => {
        await this.cacheService.addDescendantTo(ancestorUID, descendantUID);
      }),
    );
  }

  @Post('/binaryFact')
  async binaryFact(@Body() body) {
    const result = await this.submissionService.submitBinaryFact(body);

    // update the lineage cache
    await this.updateLineage(result.fact.lh_object_uid);

    this.cacheService.clearDescendants();

    return result;
  }

  @Post('/binaryFacts')
  async binaryFacts(@Body() body) {
    const result = await this.submissionService.submitBinaryFacts(body);

    // update the lineage cache
    await Promise.all(
      result.facts.map(async (fact) => {
        await this.updateLineage(fact.lh_object_uid);
      }),
    );

    // TODO: could probably be optimized by only
    // updating the lineage of the unique lh_object_uids
    this.cacheService.clearDescendants();

    return result;
  }

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
  @ApiOperation({ summary: 'Update entity name' })
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
