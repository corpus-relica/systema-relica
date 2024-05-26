import { Controller, Get, Query } from '@nestjs/common';
import { AspectService } from './aspect.service';

@Controller('aspect')
export class AspectController {
  constructor(private readonly aspectService: AspectService) {}

  @Get('get')
  async getDef(@Query('uid') uid: string): Promise<any> {
    const result = await this.aspectService.getDefinition(parseInt(uid));

    return result;
  }

  @Get('qualifications')
  async getQualifications(@Query('uid') uid: string): Promise<any> {
    const result = await this.aspectService.getQualifications(parseInt(uid));

    return result;
  }
}
