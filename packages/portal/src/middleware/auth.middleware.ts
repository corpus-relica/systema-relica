import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ShutterWebSocketClientService } from '../services/shutter-websocket-client.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    jwt: string;
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly shutterClient: ShutterWebSocketClientService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or invalid authorization header');
      }

      const jwt = authHeader.substring(7);
      
      // Validate JWT with Shutter service
      const validationResult = await this.shutterClient.validateJWT(jwt);
      
      // Attach user info to request
      req.user = {
        userId: validationResult.userId,
        jwt: jwt,
      };
      
      next();
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid authentication token');
    }
  }
}