import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

const apiPort = process.env.RELICA_CLARITY_API_PORT;

console.log('Starting Clarity...' + apiPort);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Relica Clarity API')
    .setDescription(
      'The Relica Clarity API, for semantic model operations and Quintessential Model management.',
    )
    .setVersion('1.0')
    .addTag('clarity')
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
