import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClarityWebSocketClientService } from '../services/clarity-websocket-client.service';
import { User } from '../decorators/user.decorator';

@ApiTags('Environment')
@Controller('environment')
export class EnvironmentController {
  constructor(private readonly clarityClient: ClarityWebSocketClientService) {}


  @Get('retrieve')
  @ApiOperation({ summary: 'Retrieve environment information' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'uid', description: 'UID of the environment', required: true })
  @ApiResponse({ status: 200, description: 'Environment retrieved successfully' })
  async retrieveEnvironment(
    @User() user: any,
    @Query('uid') uid: string,
  ) {
    try {
      if (!uid) {
        throw new BadRequestException('uid parameter is required');
      }
      
      const environment = await this.clarityClient.getEnvironment(uid);
      
      return {
        success: true,
        environment,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Environment not found',
      };
    }
  }
}