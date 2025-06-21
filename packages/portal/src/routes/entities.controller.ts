import { Controller, Get, Post, Query, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ArchivistSocketClient } from '@relica/websocket-clients';
import { User } from '../decorators/user.decorator';
import { ENTITY_TYPE_ENDPOINT,
         ENTITY_CATEGORY_ENDPOINT,
         COLLECTIONS_ENDPOINT } from '@relica/constants'

@ApiTags('Entities')
@Controller()
export class EntitiesController {
  constructor(private readonly archivistClient: ArchivistSocketClient) {}


  // @Get('kinds')
  // @ApiOperation({ summary: 'Get all available kinds' })
  // @ApiBearerAuth()
  // @ApiResponse({ status: 200, description: 'List of kinds retrieved successfully' })
  // async getKinds(@User() user: any) {
  //   try {
  //     const kinds = await this.archivistClient.getKinds();
  //     return {
  //       success: true,
  //       kinds,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: error.message || 'Failed to retrieve kinds',
  //     };
  //   }
  // }

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


      // Parse the UIDs parameter (expecting format "[1,2,3]" or "1,2,3")
      let uidArray: number[];
      
      if (uids.startsWith('[') && uids.endsWith(']')) {
        // Remove brackets and parse as JSON
        uidArray = JSON.parse(uids);
      } else {
        // Split by comma and parse each number
        uidArray = uids.split(',').map(uid => parseInt(uid.trim(), 10));
      }

      // Validate that all UIDs are valid numbers
      if (uidArray.some(uid => isNaN(uid))) {
        throw new BadRequestException('Invalid UID format. All UIDs must be valid numbers.');
      }

      const result = await this.archivistClient.resolveUIDs(uidArray);
      if(result.success === false) {
        throw new Error(`Failed to resolve entities: ${result.payload || 'Unknown error'}`);
      }

      return result.payload;

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
        uids: { type: 'array', items: { type: 'number' } }
      },
      required: ['uids']
    }
  })
  @ApiResponse({ status: 200, description: 'Entities resolved successfully' })
  async resolveEntitiesPost(
    @User() user: any,
    @Body() body: { uids: number[] },
  ) {
    try {
      if (!body.uids || !Array.isArray(body.uids)) {
        throw new BadRequestException('uids array is required in request body');
      }

      // Validate that all UIDs are valid numbers
      if (body.uids.some(uid => typeof uid !== 'number' || isNaN(uid))) {
        throw new BadRequestException('All UIDs must be valid numbers');
      }
      
      const entities = await this.archivistClient.resolveUIDs(body.uids);
      
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

  // RETRIEVE ENTITY_
  @Get(ENTITY_TYPE_ENDPOINT)
  @ApiOperation({ summary: 'Retrieve entity type' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Entity type retrieved successfully' })
  async retrieveEntityType(
    @User() user: any,
    @Query('uid') uid: number, // Optional query parameter to filter by kind
  ) {
    try {

      const entityType = await this.archivistClient.getEntityType(+uid);
      return entityType;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to retrieve entity collections',
      };
    }
  }

  @Get(ENTITY_CATEGORY_ENDPOINT)
  @ApiOperation({ summary: 'Retrieve entity category' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Entity category retrieved successfully' })
  async retrieveEntityCategory(
    @User() user: any,
    @Query('uid') uid: number, // Optional query parameter to filter by kind
  ) {
    try {

      const entityCat = await this.archivistClient.getEntityCategory(+uid);
      return entityCat;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to retrieve entity category',
      };
    }
  }

  @Get(COLLECTIONS_ENDPOINT)
  @ApiOperation({ summary: 'Retrieve entity collections, the collections defined in the semantic model' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Entity collections retrieved successfully' })
  async retrieveEntityCollections() {
    try {

      const collections = await this.archivistClient.getEntityCollections();
      return collections
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to retrieve entity collections',
      };
    }
  }
}
