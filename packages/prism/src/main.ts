import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));
  
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