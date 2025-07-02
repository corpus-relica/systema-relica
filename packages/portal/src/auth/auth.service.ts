import { Injectable } from '@nestjs/common';
import { ShutterRestClientService } from '../shared/services/shutter-rest-client.service';

@Injectable()
export class AuthService {
  constructor(private readonly shutterClient: ShutterRestClientService) {}

  async authenticate(username: string, password: string) {
    return this.shutterClient.authenticate(username, password);
  }

  async refreshToken(refreshToken: string) {
    return this.shutterClient.refreshToken(refreshToken);
  }

  async getGuestToken() {
    return this.shutterClient.getGuestToken();
  }

  async logout(token: string) {
    return this.shutterClient.logout(token);
  }

  async validateToken(token: string) {
    return this.shutterClient.validateToken(token);
  }
}