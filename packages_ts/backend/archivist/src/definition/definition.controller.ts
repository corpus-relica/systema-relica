import { Controller, Get, Query } from '@nestjs/common';
import { DefinitionService } from './definition.service.js';

@Controller('definition')
export class DefinitionController {
  constructor(private readonly definitionService: DefinitionService) {}

  @Get('get')
  async getDef(@Query('uid') uid: string): Promise<any> {
    const result = await this.definitionService.getDefinition(parseInt(uid));

    return result;
  }
}
