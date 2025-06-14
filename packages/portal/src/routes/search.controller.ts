import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ArchivistWebSocketClientService } from '../services/archivist-websocket-client.service';
import { User } from '../decorators/user.decorator';

@ApiTags('Search')
@Controller()
export class SearchController {
  constructor(private readonly archivistClient: ArchivistWebSocketClientService) {}


  @Get('generalSearch/text')
  @ApiOperation({ summary: 'Search entities by text' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'query', description: 'Text to search for', required: true })
  @ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false })
  @ApiQuery({ name: 'offset', description: 'Offset for pagination', required: false })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchText(
    @User() user: any,
    @Query('query') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      if (!query) {
        throw new BadRequestException('query parameter is required');
      }
      
      const limitNum = limit ? parseInt(limit, 10) : 10;
      const offsetNum = offset ? parseInt(offset, 10) : 0;
      
      const results = await this.archivistClient.searchText(query, limitNum, offsetNum);
      
      return {
        success: true,
        results,
        total: results.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to perform text search',
      };
    }
  }

  @Get('generalSearch/uid')
  @ApiOperation({ summary: 'Search entities by UID' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'uid', description: 'UID to search for', required: true })
  @ApiResponse({ status: 200, description: 'Entity found successfully' })
  async searchByUid(
    @User() user: any,
    @Query('uid') uid: string,
  ) {
    try {
      if (!uid) {
        throw new BadRequestException('uid parameter is required');
      }
      
      const entity = await this.archivistClient.searchUid(uid);
      
      return {
        success: true,
        entity,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Entity not found',
      };
    }
  }
}