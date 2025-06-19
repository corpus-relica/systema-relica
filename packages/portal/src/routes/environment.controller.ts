import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApertureWebSocketClientService } from '../services/aperture-websocket-client.service';
import { User } from '../decorators/user.decorator';

@ApiTags('Environment')
@Controller('environment')
export class EnvironmentController {
  constructor(private readonly apertureClient: ApertureWebSocketClientService) {}


  @Get('retrieve')
  @ApiOperation({ summary: 'Retrieve environment information' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'uid', description: 'UID of the environment', required: true })
  @ApiResponse({ status: 200, description: 'Environment retrieved successfully' })
  async retrieveEnvironment(
    @User() user: any,
    @Query('userId') userId: number,
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('uid parameter is required');
      }

      const environment = await this.apertureClient.getEnvironment(userId);

      if (!environment) {
        throw new BadRequestException('Environment not found');
      }

      return environment;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Environment not found',
      };
    }
  }
}
