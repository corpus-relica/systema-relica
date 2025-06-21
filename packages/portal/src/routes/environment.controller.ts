import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApertureSocketClient } from '@relica/websocket-clients';
import { User } from '../decorators/user.decorator';

@ApiTags('Environment')
@Controller('environment')
export class EnvironmentController {
  constructor(private readonly apertureClient: ApertureSocketClient) {}


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

      const result = await this.apertureClient.getEnvironment(userId.toString());

      if (!result.success) {
        throw new BadRequestException(result.error || 'Environment not found');
      }

      return result.data || result;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Environment not found',
      };
    }
  }
}
