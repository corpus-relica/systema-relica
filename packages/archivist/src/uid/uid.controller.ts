import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { UIDService } from './uid.service';
// import { SendEventDto, startTransactionDto } from './transaction.dto';

@Controller('uid')
export class UIDController {
  private readonly logger = new Logger(UIDController.name);

  constructor(private readonly uidService: UIDService) {}

  @Get('reserve-uid')
  getReserveUID(@Query('n') n: string) {
    return this.uidService.reserveUID(parseInt(n));
  }
}
