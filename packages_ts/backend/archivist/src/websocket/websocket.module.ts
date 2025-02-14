import { Module } from '@nestjs/common';
import { WebSocketService } from './websocket.service.js';
import { GellishBaseService } from '../gellish-base/gellish-base.service.js';
import { GraphService } from '../graph/graph.service.js';
import { CacheService } from '../cache/cache.service.js';
import { LinearizationService } from '../linearization/linearization.service.js';

@Module({
  providers: [
    WebSocketService,
    GellishBaseService,
    GraphService,
    CacheService,
    LinearizationService
  ],
  exports: [WebSocketService]
})
export class WebSocketModule {}
