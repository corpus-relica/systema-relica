import { Controller, Post, Body, UnauthorizedException, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { User } from '../shared/decorators/user.decorator';
import { Public } from '../shared/decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
  })
  async login(@Body() credentials: { username: string; password: string }) {
    try {
      const result = await this.authService.authenticate(
        credentials.username,
        credentials.password
      );
      console.log('Login result:', result);
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
      const result = await this.authService.refreshToken(body.refresh_token);
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('guest')
  @Public()
  @ApiOperation({ summary: 'Get guest token for setup flow' })
  @ApiResponse({ 
    status: 200, 
    description: 'Guest token retrieved successfully',
  })
  async getGuestToken() {
    try {
      const result = await this.authService.getGuestToken();
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get guest token',
      };
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
      await this.authService.logout(token);
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
      
      const validationResult = await this.authService.validateToken(token);
      if (!validationResult.valid) {
        throw new UnauthorizedException(validationResult.error || 'Invalid token');
      }

      const socketToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        token: socketToken,
        userId: validationResult.user?.id || user.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Invalid JWT token',
      };
    }
  }
}
