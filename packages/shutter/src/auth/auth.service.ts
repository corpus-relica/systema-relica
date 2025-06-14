import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signIn(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.verifyPassword(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.usersService.updateLastLogin(user.id);

    const payload = {
      'user-id': user.id,
      email: user.email,
      admin: user.is_admin,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '24h',
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
      },
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return {
        message: 'Token valid',
        identity: payload,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      sub: user.id.toString(),
      username: user.email,
    };
  }

  async createGuestToken() {
    const payload = {
      'user-id': 'guest',
      email: 'guest',
      roles: ['setup'],
      guest: true,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '30m', // 30 minutes for guest tokens
    });

    return {
      token,
      user: {
        id: 'guest',
        username: 'guest',
        roles: ['setup'],
      },
    };
  }
}