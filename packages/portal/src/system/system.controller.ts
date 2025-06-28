import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../shared/decorators/public.decorator';
import { SystemService } from './system.service';

@ApiTags('System')
@Controller()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth(): string {
    return 'healthy';
  }


  @Post('api/prism/debug/reset-system')
  @Public()
  @ApiOperation({ summary: '!! Completely reset the system !!' })
  @ApiResponse({ status: 200, description: 'Successfully reset system' })
  async resetSystem() {
    try {
      console.log('🚨 Resetting system via Portal → Prism...');
      
      const result = await this.systemService.resetSystem();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset system');
      }
      
      return {
        success: true,
        result: result.data || result,
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to reset system',
      };
    }
  }
}
