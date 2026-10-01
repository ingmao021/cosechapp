import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DomainErrorFilter, PrismaErrorFilter } from './infrastructure/http/domain-error.filter';

/** Configuración HTTP común a producción y a las pruebas e2e. */
export function configureApp(app: INestApplication): INestApplication {
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Filtros en orden de registro: el último registrado se evalúa primero.
  app.useGlobalFilters(new PrismaErrorFilter(), new DomainErrorFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  return app;
}
