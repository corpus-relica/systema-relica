import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Param,
  Body,
  Logger,
} from '@nestjs/common';
import { FactService } from './fact.service.js';
import { GellishBaseService } from '../gellish-base/gellish-base.service.js';
import { CacheService } from '../cache/cache.service.js';

@Controller('fact')
export class FactController {
  private readonly logger = new Logger(FactController.name);
  constructor(
    private readonly factService: FactService,
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

  @Get('subtypes')
  async getSubtypes(@Query('uid') uid: string) {
    return this.factService.getSubtypes(parseInt(uid));
  }

  @Get('subtypesCone')
  async getSubtypesCone(@Query('uid') uid: string) {
    return this.factService.getSubtypesCone(parseInt(uid));
  }

  @Get('classified')
  async getClassified(
    @Query('uid') uid: string,
    @Query('recursive') recursive: string = 'false',
  ) {
    this.logger.log('getClassified', uid, recursive);
    const result = await this.factService.getClassified(
      parseInt(uid),
      recursive === 'true',
    );
    this.logger.log('getClassified Result', result);
    return result;
  }

  @Get('classificationFact')
  async getClassificationFact(@Query('uid') uid: string) {
    return this.gellishBaseService.getClassificationFact(parseInt(uid));
  }

  @Get('classificationFacts')
  async getClassificationFacts(@Query('uid') uid: string) {
    return this.gellishBaseService.getClassificationFacts(parseInt(uid));
  }

  @Get('specializationHierarchy')
  async getSpecializationHierarchy(@Query('uid') uid: string) {
    return this.gellishBaseService.getSpecializationHierarchy(parseInt(uid));
  }

  @Get('SH')
  async getSH(@Query('uid') uid: string) {
    return this.gellishBaseService.getSH(parseInt(uid));
  }

  @Get('specializationFact')
  async getSpecializationFact(@Query('uid') uid: string) {
    return this.gellishBaseService.getSpecializationFact(parseInt(uid));
  }

  @Get('specializationFacts')
  async getSpecializationFacts(@Query('uids') uids: number[]) {
    return this.gellishBaseService.getSpecializationFacts(uids);
  }

  @Get('synonymFacts')
  async getSynonyms(@Query('uid') uid: string) {
    return this.gellishBaseService.getSynonyms(parseInt(uid));
  }

  @Get('inverseFacts')
  async getInverses(@Query('uid') uid: string) {
    return this.gellishBaseService.getInverses(parseInt(uid));
  }

  @Get('factsAboutKind')
  async getFactsAboutKind(@Query('uid') uid: string) {
    return this.factService.getFactsAboutKind(parseInt(uid));
  }

  @Get('factsAboutIndividual')
  async getFactsAboutIndividual(@Query('uid') uid: string) {
    return this.factService.getFactsAboutIndividual(parseInt(uid));
  }

  @Get('factsAboutRelation')
  async getFactsAboutRelation(@Query('uid') uid: string) {
    return this.factService.getFactsAboutRelation(parseInt(uid));
  }

  @Get('allRelatedFacts')
  async getAllRelatedFactsRecursive(
    @Query('uid') uid: string,
    @Query('depth') depth: string = '1',
  ) {
    return await this.factService.getAllRelatedFactsRecursive(
      parseInt(uid),
      parseInt(depth),
    );
  }

  ////////////////
  // BEGIN FACT //
  ////////////////

  @Get('/fact')
  async getFact(@Query('uid') uid: string) {
    return this.gellishBaseService.getFact(parseInt(uid));
  }

  @Post('/fact')
  async postFact(@Body() body: any) {
    const result = await this.factService.submitBinaryFact(body);

    // update the lineage cache
    await this.updateLineage(result.fact.lh_object_uid);

    this.cacheService.clearDescendants();

    return result;
  }

  @Put('/fact')
  async putFact(@Body() body: any) {
    const result = await this.factService.updateBinaryFact(body);
    return result;
  }

  @Delete('/fact')
  async deleteFact(@Query('uid') uid: string) {
    if (!uid) {
      //res.status(400).send('UID is required');
    }
    console.log('DELETE FACT', uid);
    const result = await this.factService.deleteFact(parseInt(uid));
    return result;
  }

  //////////////
  // END FACT //
  //////////////

  @Post('/facts')
  async postFacts(@Body() body) {
    // this.logger.log('submitBinaryFacts', body);
    const result = await this.factService.submitBinaryFacts(body);

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

  @Get('/facts')
  async getFacts(@Query('uids') uids: number[]) {
    return this.gellishBaseService.getFacts(uids);
  }

  @Delete('/facts')
  async deleteFacts(@Body() body) {
    console.log('DELETE FACTS A', body);
    let uids = body.map((uid) => parseInt(uid.toString()));
    console.log('DELETE FACTS', uids);
    const result = await this.factService.deleteFacts(uids);
    return result;
  }

  @Get('relatedOnUIDSubtypeCone')
  async getRelatedOnUIDSubtypeCone(
    @Query('lh_object_uid') lh_object_uid: string,
    @Query('rel_type_uid') rel_type_uid: string,
  ) {
    return this.factService.getRelatedOnUIDSubtypeCone(
      parseInt(lh_object_uid),
      parseInt(rel_type_uid),
    );
  }

  @Get('definitiveFacts')
  async getDefinitiveFacts(@Query('uid') uid: string) {
    return this.gellishBaseService.getDefinitiveFacts(parseInt(uid));
  }

  @Get('factsRelatingEntities')
  async getFactsRelatingEntities(
    @Query('uid1') uid1: string,
    @Query('uid2') uid2: string,
  ) {
    return this.factService.getFactsRelatingEntities(
      parseInt(uid1),
      parseInt(uid2),
    );
  }
}
