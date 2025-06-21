import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClaritySocketClient } from '@relica/websocket-clients';
import { User } from '../decorators/user.decorator';

@ApiTags('Model')
// @Controller('model')
@Controller('model')
export class ModelController {
  constructor(private readonly clarityClient: ClaritySocketClient) {}


  @Get()
  @ApiOperation({ summary: 'Retrieve model information' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Model information retrieved successfully' })
  async getModel(
    @User() user: any,
    @Query('uid') uid: number
  ) {
    try {

      console.log('Retrieving model information for user:', user, uid);
      const model = await this.clarityClient.getModel(uid);
      
      return {
        success: true,
        model,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to retrieve model',
      };
    }
  }

  @Get('kind')
  @ApiOperation({ summary: 'Retrieve kind model information' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'uid', description: 'UID of the kind', required: true })
  @ApiResponse({ status: 200, description: 'Kind model retrieved successfully' })
  async getKindModel(
    @User() user: any,
    @Query('uid') uid: string,
  ) {
    try {
      if (!uid) {
        throw new BadRequestException('uid parameter is required');
      }
      
      const kind = await this.clarityClient.getKindModel(uid);
      
      return {
        success: true,
        kind,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Kind not found',
      };
    }
  }

  @Get('individual')
  @ApiOperation({ summary: 'Retrieve individual model information' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'uid', description: 'UID of the individual', required: true })
  @ApiResponse({ status: 200, description: 'Individual model retrieved successfully' })
  async getIndividualModel(
    @User() user: any,
    @Query('uid') uid: string,
  ) {
    try {
      if (!uid) {
        throw new BadRequestException('uid parameter is required');
      }
      
      const individual = await this.clarityClient.getIndividualModel(uid);
      
      return {
        success: true,
        individual,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Individual not found',
      };
    }
  }
}
