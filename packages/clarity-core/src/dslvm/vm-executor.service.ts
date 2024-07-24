import { Injectable } from '@nestjs/common';
// import { StateStore } from '../state-management/state-store.service';
import { EnvironmentService } from '../environment/environment.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class VMExecutor {
  private logger: Logger = new Logger('VMExecutor');

  constructor(private environment: EnvironmentService) {}

  async execute(parsedCommand: any): Promise<void> {
    // Implement VM execution logic
    // This might involve dispatching actions to the StateStore
    this.logger.log('Executing command');
    this.logger.log(parsedCommand);
  }
}
