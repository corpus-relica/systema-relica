import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(username);
    if (user?.password_hash !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async validate(token: string): Promise<{ username: string }> {
    // try {
    const payload = await this.jwtService.verifyAsync(token);
    this.logger.log('validate', payload);
    return { username: payload.username };
    // } catch (e) {
    //   this.logger.error('Error validating token /////////////////////////');
    //   this.logger.error(e);
    //   // throw new UnauthorizedException();
    //   throw e;
    // }
  }
}
