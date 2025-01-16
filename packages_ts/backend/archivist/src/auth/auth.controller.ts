import {
  Body,
  Headers,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { Public } from './auth.decorator.js';
import { UnauthorizedException } from '@nestjs/common';
import { SignInDto } from './auth.dto.js';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Public()
  @Post('validate')
  async validate(@Headers() headers: Record<string, any>) {
    const { authorization } = headers;
    if (!authorization) {
      throw new UnauthorizedException('No token provided');
    }

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer') {
      throw new UnauthorizedException('Invalid token type');
    }

    return this.authService.validate(token);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
