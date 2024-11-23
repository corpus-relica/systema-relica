import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { SendEventDto, startTransactionDto } from './transaction.dto';

@Controller('transaction')
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(private readonly transactionService: TransactionService) {}

  @Post('start')
  @ApiBody({ type: startTransactionDto })
  startTransaction(@Body('machineName') machineName: string) {
    this.logger.log(`Starting transaction for machine: ${machineName}`);

    return this.transactionService.startMachine(machineName);
  }

  @Post('event')
  @ApiBody({ type: SendEventDto })
  sendEvent(@Body('event') event: any) {
    this.transactionService.sendEvent(event);
  }

  @Get('pending-states')
  getPendingStates() {
    return this.transactionService.getPendingStates();
  }

  @Get('snapshot')
  getSnapshot() {
    return this.transactionService.getSnapshot();
  }

  @Post('resume')
  resumeLastTransaction() {
    return this.transactionService.resumeLastMachine();
  }
}
