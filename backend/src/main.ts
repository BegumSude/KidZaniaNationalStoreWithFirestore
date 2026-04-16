import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Security headers
    app.use(helmet());

    // Strict CORS policy
    const corsOrigins = configService.get<string>('CORS_ORIGINS');
    const allowedOrigins = corsOrigins ? corsOrigins.split(',') : [];

    app.enableCors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            // For strictly browser-only endpoints, remove the !origin check
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    // Global validation pipe for strict DTO checking
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Strip out properties that do not have any decorators
            forbidNonWhitelisted: true, // Throw an error instead of stripping non-whitelisted properties
            transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
        }),
    );

    // Global exception filter to prevent stack trace leaks
    app.useGlobalFilters(new HttpExceptionFilter());

    const port = configService.get<number>('PORT') || 3001;
    await app.listen(port);
    console.log(`Backend is running on: http://localhost:${port}`);
}
bootstrap();
