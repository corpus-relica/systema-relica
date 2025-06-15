import { Controller, Post, Body, UnauthorizedException, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ShutterRestClientService } from '../services/shutter-rest-client.service';
import { User } from '../decorators/user.decorator';
import { Public } from '../decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly shutterClient: ShutterRestClientService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
  })
  async login(@Body() credentials: { username: string; password: string }) {
    try {
      const result = await this.shutterClient.authenticate(
        credentials.username,
        credentials.password
      );
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
  })
  async refreshToken(@Body() body: { refresh_token: string }) {
    try {
      const result = await this.shutterClient.refreshToken(body.refresh_token);
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
  })
  async logout(@Headers('authorization') authHeader: string) {
    try {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }
      await this.shutterClient.logout(token);
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Logout failed',
      };
    }
  }

  @Post('websocket')
  @ApiOperation({ summary: 'Authenticate for WebSocket connections' })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'WebSocket authentication successful',
  })
  async authenticateWebSocket(@User() user: any, @Headers('authorization') authHeader: string) {
    try {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }
      
      const validationResult = await this.shutterClient.validateToken(token);
      if (!validationResult.valid) {
        throw new UnauthorizedException(validationResult.error || 'Invalid token');
      }

      const socketToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        token: socketToken,
        'user-id': validationResult.user?.id || user.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Invalid JWT token',
      };
    }
  }
}