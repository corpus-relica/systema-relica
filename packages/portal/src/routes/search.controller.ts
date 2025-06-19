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
  // @ApiQuery({ name: 'query', description: 'Text to search for', required: true })
  // @ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false })
  // @ApiQuery({ name: 'offset', description: 'Offset for pagination', required: false })
  @ApiQuery({ name: 'searchTerm', description: 'Text to search for', required: true })
  @ApiQuery({ name: 'collectionUID', description: 'Collection UID to search within', required: false })
  @ApiQuery({ name: 'page', description: 'Page number for pagination', required: false })
  @ApiQuery({ name: 'pageSize', description: 'Number of results per page', required: false })
  @ApiQuery({ name: 'filter', description: 'Filter criteria for search', required: false })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchText(
    @User() user: any,
    @Query('searchTerm') searchTerm: string,
    @Query('collectionUID') collectionUID?: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('filter') searchFilter?: string,
  ) {
    try {
      console.log('SearchController.searchText called with:', { searchTerm, collectionUID, page, pageSize, searchFilter });

      if (!searchTerm) {
        throw new BadRequestException('query parameter is required');
      }
      
      const limitNum = pageSize ? pageSize : 10; // Default to 10 if not provided
      const offsetNum = page ? page : 0; // Default to 0 if not provided

      console.log('Parsed limit:', limitNum, 'offset:', offsetNum);

      const results = await this.archivistClient.searchText(searchTerm, collectionUID, limitNum, offsetNum, searchFilter);

      console.log('Search results:', results);

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
