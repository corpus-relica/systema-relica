import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PrismWebSocketClientService } from '../services/prism-websocket-client.service';
import { User } from '../decorators/user.decorator';

@ApiTags('Prism')
@Controller('api/prism/setup')
export class PrismController {
  constructor(private readonly prismClient: PrismWebSocketClientService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get Prism setup status' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Setup status retrieved successfully' })
  async getSetupStatus(@User() user: any) {
    try {
      
      const status = await this.prismClient.getSetupStatus();
      
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
      
      const result = await this.prismClient.startSetup();
      
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

  @Post('create-user')
  @ApiOperation({ summary: 'Create user during Prism setup' })
  @ApiBearerAuth()
  @ApiBody({
    description: 'User creation data',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Username for the new user' },
        password: { type: 'string', description: 'Password for the new user' },
        confirmPassword: { type: 'string', description: 'Password confirmation' },
      },
      required: ['username', 'password', 'confirmPassword'],
    },
  })
  @ApiResponse({ status: 200, description: 'User created successfully' })
  async createUser(
    @User() user: any,
    @Body() body: { username: string; password: string; confirmPassword: string },
  ) {
    try {
      
      if (!body.username || !body.password || !body.confirmPassword) {
        throw new BadRequestException('Username, password, and confirmPassword are required');
      }
      
      if (body.password !== body.confirmPassword) {
        throw new BadRequestException('Password and confirmation do not match');
      }
      
      const result = await this.prismClient.createUser(body);
      
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
      
      const result = await this.prismClient.importData(body);
      
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
      
      const result = await this.prismClient.resetSystem();
      
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