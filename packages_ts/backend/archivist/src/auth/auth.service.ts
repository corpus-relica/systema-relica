import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { SignInDto } from './auth.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(signInDto.username);
    if (!user) {
      // Use the same error message to prevent username enumeration
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`Signing in user ${user.username}`);
    this.logger.log(`Password hash: ${user.password_hash}`);
    this.logger.log(`Password: ${signInDto.password}`);

    const isPasswordValid = await bcrypt.compare(
      signInDto.password,
      user.password_hash,
    );

    this.logger.log(`Password is valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      // Add any additional claims you need
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async validate(token: string): Promise<{ username: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      return { username: payload.username };
    } catch (e) {
      this.logger.error('Token validation failed', e);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
