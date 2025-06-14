import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      service: 'prism',
      version: '0.0.1',
      description: 'System initialization, monitoring, and batch operations service',
      endpoints: {
        health: '/health',
        setup: '/setup',
        batch: '/batch',
        websocket: 'ws://localhost:3005',
      },
    };
  }

  getStatus() {
    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }
}