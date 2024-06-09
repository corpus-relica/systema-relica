import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { UIDService } from './uid/uid.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly uidService: UIDService,
  ) {
    uidService.init();
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
