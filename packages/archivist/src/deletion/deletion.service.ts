import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DeletionService {
  private readonly logger = new Logger(DeletionService.name);

  constructor() {
    this.logger.log('~~~~~~~~~~~~DELETION SERVICE~~~~~~~~~~~~');
  }
}
