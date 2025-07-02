import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ShutterRestClientService } from './shutter-rest-client.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [ShutterRestClientService],
  exports: [ShutterRestClientService],
})
export class RestClientsModule {}