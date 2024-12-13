import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

console.log('main.ts');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Relica Archivist API')
    .setDescription(
      'The Relica Archivist API, for managing and querying the Relica Archivist database.',
    )
    .setVersion('1.0')
    .addTag('archivist')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: '*', //process.env.RELICA_NEO4J_ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'range'],
    exposedHeaders: ['Content-Range'],
  });

  await await app.listen(3000, '0.0.0.0');
}

bootstrap();
