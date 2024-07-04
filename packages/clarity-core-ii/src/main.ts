import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

// const apiPort = process.env.RELICA_CLARITY_CORE_API_PORT;

// console.log('Starting Clarity Core...' + apiPort);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Relica Clarity-Core API')
    .setDescription(
      'The Relica Clarity-Core API, for managing and querying the Relica Clarity-Core environment.',
    )
    .setVersion('1.0')
    .addTag('clarity-core')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: '*', //process.env.RELICA_NEO4J_ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'range'],
    exposedHeaders: ['Content-Range'],
  });
  await app.listen(3001, '0.0.0.0');
}

bootstrap();
