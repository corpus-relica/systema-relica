import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ArchivistWebSocketClientService } from '../services/archivist-websocket-client.service';
import { User } from '../decorators/user.decorator';

@ApiTags('Kinds')
@Controller()
export class KindsController {
  constructor(private readonly archivistClient: ArchivistWebSocketClientService) {}

  @Get('kinds')
  @ApiOperation({ summary: 'Get paginated list of kinds with sorting and filtering' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'sort', description: 'Sort parameters as JSON array [field, order]', required: false, example: '["lh_object_name", "ASC"]' })
  @ApiQuery({ name: 'range', description: 'Pagination range as JSON array [skip, pageSize]', required: false, example: '[0, 10]' })
  @ApiQuery({ name: 'filter', description: 'Filter parameters as JSON object', required: false, example: '{}' })
  @ApiResponse({ status: 200, description: 'Paginated kinds list retrieved successfully' })
  async getKindsList(
    @User() user: any,
    @Query('sort') sort?: string,
    @Query('range') range?: string,
    @Query('filter') filter?: string,
  ) {
    console.log("FOOOEY!!!")
    try {
      // Parse parameters with defaults (following Clojure implementation pattern)
      const sortParams = this.parseJsonParam(sort, ['lh_object_name', 'ASC']);
      const rangeParams = this.parseJsonParam(range, [0, 10]);
      const filterParams = this.parseJsonParam(filter, {});

      const [sortField, sortOrder] = sortParams;
      const [skip, pageSize] = rangeParams;

      // Validate parameters
      if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
        throw new BadRequestException('Sort order must be ASC or DESC');
      }

      if (skip < 0 || pageSize <= 0) {
        throw new BadRequestException('Invalid pagination parameters');
      }

      // Call Archivist via WebSocket with contract-compliant message
      const result = await this.archivistClient.getKindsList(
        sortField,
        sortOrder.toUpperCase(),
        skip,
        pageSize,
        filterParams
      );

      if(result.success === false) {
        throw new BadRequestException(result.payload || 'Failed to retrieve kinds list');
      }

      const {facts, total} = result.payload;

      console.log('Received kinds list from Archivist:', result);

      const response = {
        success: true,
        kinds: {
          data: facts || [],
          total: total || 0,
        },
      };

      return response;

    } catch (error) {
      console.error('Error in getKindsList:', error);
      return {
        success: false,
        error: error.message || 'Failed to retrieve kinds list',
      };
    }
  }

  /**
   * Parse JSON parameter with fallback to default value
   * Follows the Clojure implementation pattern
   */
  private parseJsonParam(param: string | undefined, defaultValue: any): any {
    if (!param) {
      return defaultValue;
    }

    try {
      return JSON.parse(param);
    } catch (error) {
      console.warn(`Failed to parse JSON parameter: ${param}, using default:`, defaultValue);
      return defaultValue;
    }
  }
}
