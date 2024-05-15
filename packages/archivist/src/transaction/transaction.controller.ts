import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
    private readonly logger = new Logger(TransactionController.name);

    constructor(private readonly transactionService: TransactionService) {}

    @Post('start')
    startTransaction(@Query('machineName') machineName: string) {
        this.logger.log(`Starting transaction for machine: ${machineName}`);

        return this.transactionService.startMachine(machineName);
    }

    @Post('event')
    sendEvent(@Body('event') event: any) {
        this.transactionService.sendEvent(event);
    }

    @Get('pending-states')
    getPendingStates() {
        return this.transactionService.getPendingStates();
    }

    @Post('resume')
    resumeLastTransaction() {
        return this.transactionService.resumeLastMachine();
    }
}
