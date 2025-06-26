import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Debug logging for environment variables
  console.log('Aperture Environment Variables:');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_USERNAME:', process.env.DB_USERNAME);
  console.log('DB_DATABASE:', process.env.DB_DATABASE);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.APERTURE_PORT || 3007;
  await app.listen(port);
  console.log(`Aperture service running on port ${port} (WebSocket-only)`);
}

bootstrap();
