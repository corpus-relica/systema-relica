import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PortalGateway } from './gateways/portal.gateway';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { EntitiesModule } from './entities/entities.module';
import { EnvironmentModule } from './environment/environment.module';
import { FactsModule } from './facts/facts.module';
import { KindsModule } from './kinds/kinds.module';
import { ModelModule } from './model/model.module';
import { PrismModule } from './prism/prism.module';
import { SearchModule } from './search/search.module';
import { SystemModule } from './system/system.module';
import { AuthGuard } from './shared/guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '../../.env.local'],
    }),
    SharedModule,
    AuthModule,
    EntitiesModule,
    EnvironmentModule,
    FactsModule,
    KindsModule,
    ModelModule,
    PrismModule,
    SearchModule,
    SystemModule,
  ],
  providers: [
    PortalGateway,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
