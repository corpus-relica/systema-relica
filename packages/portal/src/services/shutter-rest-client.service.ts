import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class ShutterRestClientService {
  private readonly logger = new Logger(ShutterRestClientService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const host = this.configService.get<string>('SHUTTER_HOST', 'localhost');
    const port = this.configService.get<number>('SHUTTER_PORT', 3004);
    this.baseUrl = `http://${host}:${port}`;
  }

  async authenticate(username: string, password: string): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/auth/login`, {
          username,
          password,
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error('Authentication failed', error);
      throw new Error('Authentication failed');
    }
  }

  async validateToken(token: string): Promise<{
    valid: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/auth/validate`, {}, config)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Invalid token' };
      }
      this.logger.error('Token validation failed', error);
      throw new Error('Token validation failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/auth/refresh`, {
          refresh_token: refreshToken,
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw new Error('Token refresh failed');
    }
  }

  async getGuestToken(): Promise<{
    access_token: string;
    token_type: string;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/auth/guest`, {})
      );
      return response.data;
    } catch (error) {
      this.logger.error('Guest token request failed', error);
      throw new Error('Guest token request failed');
    }
  }

  async logout(token: string): Promise<void> {
    try {
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/auth/logout`, {}, config)
      );
    } catch (error) {
      this.logger.error('Logout failed', error);
      throw new Error('Logout failed');
    }
  }

  async getCurrentUser(token: string): Promise<any> {
    try {
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/auth/me`, config)
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get current user', error);
      throw new Error('Failed to get current user');
    }
  }

  async createUser(userData: {
    username: string;
    password: string;
    email?: string;
    role?: string;
  }, adminToken: string): Promise<any> {
    try {
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      };
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/users`, userData, config)
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create user', error);
      throw new Error('Failed to create user');
    }
  }
}