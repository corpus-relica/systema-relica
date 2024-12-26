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
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { Public } from './auth.decorator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Public()
  @Post('validate')
  async validate(@Headers() validateDto: Record<string, any>) {
    const { authorization } = validateDto;
    const token = authorization.split(' ')[1];

    return true;
    // try {
    //   return await this.authService.validate(token);
    // } catch (e) {
    //   this.logger.error('Error validating token /////////////////////////');
    //   this.logger.error(e);
    //   return e;
    // }
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
