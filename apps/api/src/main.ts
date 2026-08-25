import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { parseApiEnvironment } from '@property-assistant/config';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const environment = parseApiEnvironment(process.env);
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.enableCors({
    origin:
      environment.NODE_ENV === 'production'
        ? environment.WEB_ORIGIN
          ? [environment.WEB_ORIGIN]
          : false
        : true,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  const port = Number(process.env.PORT ?? environment.API_PORT);
  await app.listen(port, environment.API_HOST);
}

void bootstrap();
