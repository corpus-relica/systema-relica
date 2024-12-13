import {
  Controller,
  Post,
  Body,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { REPLService } from './repl.service';
import { ExecCommandDto } from './ExecCommandDto';

@ApiTags('REPL')
@Controller('REPLController')
export class REPLController {
  private readonly logger = new Logger(REPLController.name);

  constructor(private readonly repl: REPLService) {}

  @Post('/exec')
  @ApiOperation({ summary: 'Execute a REPL command' })
  @ApiResponse({ status: 200, description: 'Command executed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async chat(@Body() execCommandDto: ExecCommandDto) {
    this.logger.log('~~~~~~~~~~~~EXECUTE COMMAND~~~~~~~~~~~~');

    if (!execCommandDto.command) {
      throw new HttpException(
        'command key is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await new Promise<any>((resolve, reject) => {
        this.repl.exec(execCommandDto.command, resolve);
      });
      return result;
    } catch (e) {
      this.logger.error('Error in chat:', e);
      throw new HttpException(
        'Error executing command',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
