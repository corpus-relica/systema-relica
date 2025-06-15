import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ShutterRestClientService } from '../services/shutter-rest-client.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    jwt: string;
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly shutterClient: ShutterRestClientService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or invalid authorization header');
      }

      const jwt = authHeader.substring(7);
      
      // Validate JWT with Shutter service
      const validationResult = await this.shutterClient.validateToken(jwt);
      
      if (!validationResult.valid || !validationResult.user) {
        throw new UnauthorizedException('Invalid token');
      }
      
      // Attach user info to request
      req.user = {
        userId: validationResult.user.id,
        jwt: jwt,
      };
      
      next();
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid authentication token');
    }
  }
}