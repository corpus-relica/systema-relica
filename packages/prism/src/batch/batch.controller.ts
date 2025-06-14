import { Controller, Get } from '@nestjs/common';
import { BatchService } from './batch.service';

@Controller('batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get('status')
  getStatus() {
    return {
      success: true,
      data: {
        service: 'batch',
        status: 'operational',
        timestamp: new Date().toISOString(),
      },
    };
  }
}