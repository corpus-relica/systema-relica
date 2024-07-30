import {
  Controller,
  Get,
  Query,
  Inject,
  Param,
  Logger,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ModellingService } from './modelling.service';

@Controller('modelling')
export class ModellingController {
  private readonly logger = new Logger(ModellingController.name);

  constructor(private readonly modelling: ModellingService) {}

  @Get('/workflows')
  async workflows() {
    this.logger.log('~~~~~~~~~~~~GET WORKFLOWS~~~~~~~~~~~~');

    try {
      // const result = await this.artificialIntelligenceService.conjureDefinition(
      //   apiKey,
      //   supertypeUID,
      //   newKindName,
      // );

      return this.modelling.getWorkflows();
    } catch (e) {
      this.logger.error('Error getting workflows:', e);
      throw new HttpException(
        'Error getting workflows',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/state')
  async state() {
    this.logger.log('~~~~~~~~~~~~GET STATE~~~~~~~~~~~~');

    try {
      return this.modelling.getState();
    } catch (e) {
      this.logger.error('Error getting state:', e);
      throw new HttpException(
        'Error getting state',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/workflow/init/:workflowId')
  async initWorkflow(@Param('workflowId') workflowId: string) {
    this.logger.log('~~~~~~~~~~~~INIT WORKFLOW~~~~~~~~~~~~');

    try {
      return this.modelling.initWorkflow(workflowId);
    } catch (e) {
      this.logger.error('Error initializing workflow:', e);
      throw new HttpException(
        'Error initializing workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('workflow/increment/:workflowId')
  async incrementWorkflowStep(@Param('workflowId') workflowId: string) {
    this.logger.log('~~~~~~~~~~~~INCREMENT WORKFLOW STEP~~~~~~~~~~~~');

    try {
      return this.modelling.incrementWorkflowStep();
    } catch (e) {
      this.logger.error('Error incrementing workflow step:', e);
      throw new HttpException(
        'Error incrementing workflow step',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('workflow/decrement/:workflowId')
  async decrementWorkflowStep(@Param('workflowId') workflowId: string) {
    this.logger.log('~~~~~~~~~~~~DECREMENT WORKFLOW STEP~~~~~~~~~~~~');

    try {
      return this.modelling.decrementWorkflowStep();
    } catch (e) {
      this.logger.error('Error decrementing workflow step:', e);
      throw new HttpException(
        'Error decrementing workflow step',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
