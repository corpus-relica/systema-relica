import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable WebSocket adapter
  app.useWebSocketAdapter(new WsAdapter(app));
  
  // Configure CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PRISM_PORT || 3005;
  await app.listen(port);
  
  console.log(`🔮 Prism service is running on port ${port}`);
  console.log(`📡 WebSocket server available on ws://localhost:${port}`);
}

bootstrap();