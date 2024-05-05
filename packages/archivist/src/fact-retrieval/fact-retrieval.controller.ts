import { Controller, Get, Query } from '@nestjs/common';
import { FactRetrievalService } from './fact-retrieval.service';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';

@Controller('factRetrieval')
export class FactRetrievalController {
    constructor(
        private readonly factRetrievalService: FactRetrievalService,
        private readonly gellishBaseService: GellishBaseService,
    ) {}

    @Get('subtypes')
    async getSubtypes(@Query('uid') uid: string) {
        return this.factRetrievalService.getSubtypes(parseInt(uid));
    }

    @Get('classified')
    async getClassified(@Query('uid') uid: string) {
        return this.factRetrievalService.getClassified(parseInt(uid));
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
        return this.gellishBaseService.getSpecializationHierarchy(
            parseInt(uid),
        );
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
        return this.factRetrievalService.getFactsAboutKind(parseInt(uid));
    }

    @Get('factsAboutIndividual')
    async getFactsAboutIndividual(@Query('uid') uid: string) {
        return this.factRetrievalService.getFactsAboutIndividual(parseInt(uid));
    }

    @Get('factsAboutRelation')
    async getFactsAboutRelation(@Query('uid') uid: string) {
        return this.factRetrievalService.getFactsAboutRelation(parseInt(uid));
    }

    @Get('allRelatedFacts')
    async getAllRelatedFactsRecursive(
        @Query('uid') uid: string,
        @Query('depth') depth: string = '1',
    ) {
        return this.factRetrievalService.getAllRelatedFactsRecursive(
            parseInt(uid),
            parseInt(depth),
        );
    }

    @Get('fact')
    async getFact(@Query('uid') uid: string) {
        return this.gellishBaseService.getFact(parseInt(uid));
    }

    @Get('facts')
    async getFacts(@Query('uids') uids: number[]) {
        return this.gellishBaseService.getFacts(uids);
    }

    @Get('relatedOnUIDSubtypeCone')
    async getRelatedOnUIDSubtypeCone(
        @Query('lh_object_uid') lh_object_uid: string,
        @Query('rel_type_uid') rel_type_uid: string,
    ) {
        return this.factRetrievalService.getRelatedOnUIDSubtypeCone(
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
        return this.factRetrievalService.getFactsRelatingEntities(
            parseInt(uid1),
            parseInt(uid2),
        );
    }
}
