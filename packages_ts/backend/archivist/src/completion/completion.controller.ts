import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompletionService } from './completion.service.js';

@ApiTags('Completion')
@Controller('completion')
export class CompletionController {
  constructor(private readonly completionService: CompletionService) {}

  @Get('lhObject')
  async lhObject(
    @Query('rel_type_uid') rel_type_uid: string,
    @Query('rh_object_uid') rh_object_uid: string,
  ) {
    const result = await this.completionService.getLHObjectCompletion(
      parseInt(rel_type_uid),
      parseInt(rh_object_uid),
    );
    return result;
  }

  @Get('rhObject')
  async rhObject(
    @Query('lh_object_uid') lh_object_uid: string,
    @Query('rel_type_uid') rel_type_uid: string,
  ) {
    const result = await this.completionService.getRHObjectCompletion(
      parseInt(lh_object_uid),
      parseInt(rel_type_uid),
    );
    return result;
  }
}
