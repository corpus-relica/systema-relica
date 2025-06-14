import { Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ShutterWebSocketClientService } from '../services/shutter-websocket-client.service';
import { User } from '../decorators/user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly shutterClient: ShutterWebSocketClientService) {}

  @Post('websocket')
  @ApiOperation({ summary: 'Authenticate for WebSocket connections' })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'WebSocket authentication successful',
  })
  async authenticateWebSocket(@User() user: any) {
    try {
      const jwt = user.token;
      
      const validationResult = await this.shutterClient.validateJWT(jwt);
      const socketToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        token: socketToken,
        'user-id': validationResult.userId,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Invalid JWT token',
      };
    }
  }
}