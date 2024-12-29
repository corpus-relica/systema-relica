import {
  Controller,
  Get,
  Query,
  Inject,
  Param,
  Logger,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ArtificialIntelligenceService } from './artificialIntelligence.service.js';

@Controller('artificialIntelligence')
export class ArtificialIntelligenceController {
  private readonly logger = new Logger(ArtificialIntelligenceController.name);

  constructor(
    private readonly artificialIntelligenceService: ArtificialIntelligenceService,
  ) {}

  @Get('/conjureDefinition')
  async chat(
    @Query('apiKey') apiKey: string,
    @Query('supertypeUID') supertypeUID: number,
    @Query('newKindName') newKindName: string,
  ) {
    this.logger.log('~~~~~~~~~~~~CONJURE DEFINITION~~~~~~~~~~~~');

    if (!apiKey) {
      throw new HttpException('API key is required', HttpStatus.BAD_REQUEST);
    }

    if (!supertypeUID) {
      throw new HttpException(
        'Supertype UID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!newKindName) {
      throw new HttpException(
        'new kind name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.artificialIntelligenceService.conjureDefinition(
        apiKey,
        supertypeUID,
        newKindName,
      );
      return result;
    } catch (e) {
      this.logger.error('Error in chat:', e);
      throw new HttpException(
        'Error chatting',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
