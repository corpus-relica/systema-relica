import { Controller, Get, Post, Query, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ArchivistWebSocketClientService } from '../services/archivist-websocket-client.service';
import { User } from '../decorators/user.decorator';

@ApiTags('Entities')
@Controller()
export class EntitiesController {
  constructor(private readonly archivistClient: ArchivistWebSocketClientService) {}


  @Get('kinds')
  @ApiOperation({ summary: 'Get all available kinds' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'List of kinds retrieved successfully' })
  async getKinds(@User() user: any) {
    try {
      const kinds = await this.archivistClient.getKinds();
      return {
        success: true,
        kinds,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to retrieve kinds',
      };
    }
  }

  @Get('concept/entities')
  @ApiOperation({ summary: 'Resolve UIDs to entity information (GET)' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'uids', description: 'Comma-separated list of UIDs', required: true })
  @ApiResponse({ status: 200, description: 'Entities resolved successfully' })
  async resolveEntitiesGet(
    @User() user: any,
    @Query('uids') uids: string,
  ) {
    try {
      if (!uids) {
        throw new BadRequestException('uids query parameter is required');
      }
      
      const uidArray = uids.split(',').map(uid => uid.trim());
      const entities = await this.archivistClient.resolveUids(uidArray);
      
      return {
        success: true,
        entities,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to resolve entities',
      };
    }
  }

  @Post('concept/entities')
  @ApiOperation({ summary: 'Resolve UIDs to entity information (POST)' })
  @ApiBearerAuth()
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        uids: { type: 'array', items: { type: 'string' } }
      },
      required: ['uids']
    }
  })
  @ApiResponse({ status: 200, description: 'Entities resolved successfully' })
  async resolveEntitiesPost(
    @User() user: any,
    @Body() body: { uids: string[] },
  ) {
    try {
      if (!body.uids || !Array.isArray(body.uids)) {
        throw new BadRequestException('uids array is required in request body');
      }
      
      const entities = await this.archivistClient.resolveUids(body.uids);
      
      return {
        success: true,
        entities,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to resolve entities',
      };
    }
  }
}