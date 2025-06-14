import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService, LoginDto } from './auth.service';
import { Public } from './auth.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('api/login')
  @ApiOperation({ summary: 'User login' })
  signIn(@Body() loginDto: LoginDto) {
    return this.authService.signIn(loginDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('api/guest-auth')
  @ApiOperation({ summary: 'Guest authentication for setup' })
  guestAuth() {
    return this.authService.createGuestToken();
  }

  @UseGuards(AuthGuard)
  @Post('api/validate')
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiBearerAuth()
  validateToken(@Request() req) {
    return {
      message: 'Token valid',
      identity: req.user,
    };
  }

  @UseGuards(AuthGuard)
  @Get('auth/profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiBearerAuth()
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user['user-id']);
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  healthCheck() {
    return {
      status: 'healthy',
      service: 'shutter',
      timestamp: new Date().toISOString(),
    };
  }
}