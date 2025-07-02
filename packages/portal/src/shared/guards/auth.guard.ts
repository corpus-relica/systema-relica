import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ShutterRestClientService } from '../services/shutter-rest-client.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly shutterClient: ShutterRestClientService,
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
      const validationResult = await this.shutterClient.validateToken(jwt);
      
      if (!validationResult.valid || !validationResult.user) {
        throw new UnauthorizedException('Invalid token');
      }
      
      // Attach user info to request
      request.user = {
        userId: validationResult.user.id,
        jwt: jwt,
      };
      
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid authentication token');
    }
  }
}