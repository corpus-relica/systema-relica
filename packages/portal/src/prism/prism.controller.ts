import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PrismService } from './prism.service';
import { User } from '../shared/decorators/user.decorator';
import { Public } from '../shared/decorators/public.decorator';

@ApiTags('Prism')
@Controller('api/prism/setup')
export class PrismController {
  constructor(private readonly prismService: PrismService) {}

  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Get Prism setup status' })
  @ApiResponse({ status: 200, description: 'Setup status retrieved successfully' })
  async getSetupStatus() {
    try {
      
      const status = await this.prismService.getSetupStatus();
      
      return {
        success: true,
        status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get setup status',
      };
    }
  }

  @Post('start')
  @ApiOperation({ summary: 'Start Prism setup process' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Setup started successfully' })
  async startSetup(@User() user: any) {
    try {
      
      const result = await this.prismService.startSetup();
      
      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to start setup',
      };
    }
  }

  @Post('create-admin-user')
  @ApiOperation({ summary: 'Create user during Prism setup' })
  @ApiBearerAuth()
  @ApiBody({
    description: 'User creation data',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Username for the new user' },
        email: { type: 'string', format: 'email', description: 'Email for the new user' },
        password: { type: 'string', description: 'Password for the new user' },
        // confirmPassword: { type: 'string', description: 'Password confirmation' },
      },
      required: ['username', 'email', 'password'],
    },
  })
  @ApiResponse({ status: 200, description: 'User created successfully' })
  async createUser(
    @User() user: any,
    @Body() body: { username: string; email:string; password: string },
  ) {
    try {
      
      if (!body.username || !body.email || !body.password) {
        throw new BadRequestException('Username, email, and password are required');
      }
      
      // if (body.password !== body.confirmPassword) {
      //   throw new BadRequestException('Password and confirmation do not match');
      // }

      const result = await this.prismService.createUser(body);
      
      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof BadRequestException ? error.message : 'Failed to create user',
      };
    }
  }

  @Post('import-data')
  @ApiOperation({ summary: 'Import data during Prism setup' })
  @ApiBearerAuth()
  @ApiBody({
    description: 'Data import configuration',
    schema: {
      type: 'object',
      properties: {
        dataSource: { type: 'string', description: 'Source of the data to import' },
        options: { type: 'object', description: 'Import options' },
      },
      required: ['dataSource'],
    },
  })
  @ApiResponse({ status: 200, description: 'Data import started successfully' })
  async importData(
    @User() user: any,
    @Body() body: { dataSource: string; options?: any },
  ) {
    try {
      
      if (!body.dataSource) {
        throw new BadRequestException('dataSource is required');
      }
      
      const result = await this.prismService.importData(body);
      
      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof BadRequestException ? error.message : 'Failed to start data import',
      };
    }
  }

  @Post('debug/reset-system')
  @ApiOperation({ summary: 'Reset system state (DEBUG ONLY)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'System reset successfully' })
  async resetSystem(@User() user: any) {
    try {
      console.log('🚨 Portal: DEBUG reset system requested by user:', user?.username || 'unknown');
      
      const result = await this.prismService.resetSystem();
      
      return {
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Portal: System reset failed:', error);
      return {
        success: false,
        message: `System reset failed: ${error.message}`,
        errors: [error.message],
        timestamp: new Date().toISOString(),
      };
    }
  }
}
