import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ShutterWebSocketClientService } from '../services/shutter-websocket-client.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly shutterClient: ShutterWebSocketClientService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    try {
      const jwt = authHeader.substring(7);
      
      // Validate JWT with Shutter service
      const validationResult = await this.shutterClient.validateJWT(jwt);
      
      // Attach user info to request
      request.user = {
        userId: validationResult.userId,
        jwt: jwt,
      };
      
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid authentication token');
    }
  }
}