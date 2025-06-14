import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../database/neo4j.service';
import { CacheService } from '../cache/cache.service';

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  lastCheck: string;
  details?: any;
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: ServiceHealth[];
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(
    private neo4jService: Neo4jService,
    private cacheService: CacheService,
  ) {}

  async checkNeo4jHealth(): Promise<ServiceHealth> {
    try {
      // Try a simple query to check connectivity
      const result = await this.neo4jService.executeQuery('RETURN 1 as test');
      return {
        service: 'neo4j',
        status: result.success ? 'healthy' : 'unhealthy',
        lastCheck: new Date().toISOString(),
        details: result.success ? { connected: true } : { error: result.error },
      };
    } catch (error) {
      return {
        service: 'neo4j',
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        details: { error: error.message },
      };
    }
  }

  async checkCacheHealth(): Promise<ServiceHealth> {
    try {
      const rebuildStatus = this.cacheService.getRebuildStatus();
      const status = rebuildStatus.status === 'error' ? 'unhealthy' : 'healthy';
      
      return {
        service: 'cache',
        status,
        lastCheck: new Date().toISOString(),
        details: {
          rebuildStatus: rebuildStatus.status,
          progress: rebuildStatus.progress,
        },
      };
    } catch (error) {
      return {
        service: 'cache',
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        details: { error: error.message },
      };
    }
  }

  async checkSystemHealth(): Promise<SystemHealth> {
    const [neo4jHealth, cacheHealth] = await Promise.all([
      this.checkNeo4jHealth(),
      this.checkCacheHealth(),
    ]);

    const services = [neo4jHealth, cacheHealth];
    
    // Determine overall health
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');
    
    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyServices.length > 0) {
      overall = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      timestamp: new Date().toISOString(),
    };
  }
}