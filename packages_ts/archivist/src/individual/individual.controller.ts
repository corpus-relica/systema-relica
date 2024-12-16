import { Controller, Get, Param } from '@nestjs/common';
import { IndividualService } from './individual.service';

@Controller('individual')
export class IndividualController {
  constructor(
    private readonly individual: IndividualService, // You'll need to create/inject this
  ) {}

  @Get(':uid/aspects-classified-as/:kindUID')
  async getAspectsClassifiedAs(
    @Param('uid') uid: string,
    @Param('kindUID') kindUID: string,
  ) {
    return this.individual.getAspectsClassifiedAs(uid, kindUID);
  }
}
