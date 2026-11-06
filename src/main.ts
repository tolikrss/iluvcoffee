import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // This will strip any properties that are not in the DTO from the request body
    transform: true,  // This will automatically transform the request body to match the DTO class
    forbidNonWhitelisted: true, // This will throw an error if any extra properties are sent in the request body
    transformOptions: {
      enableImplicitConversion: true, // This will allow implicit type conversion for primitive types
    },
  }));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
