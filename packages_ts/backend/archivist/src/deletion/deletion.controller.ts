import { Controller, Delete, Query } from '@nestjs/common';
import { DeletionService } from './deletion.service.js';

@Controller('deletion')
export class DeletionController {
  constructor(private readonly deletionService: DeletionService) {}
}
