import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  getAuthHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
  }
}
