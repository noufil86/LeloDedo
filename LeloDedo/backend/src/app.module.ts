// src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { UserModule } from './user/user.module';
import { ToolCategoryModule } from './tool-category/tool-category.module';
import { ItemModule } from './item/item.module';
import { BorrowRequestModule } from './borrow-request/borrow-request.module';
import { MessageModule } from './message/message.module';
import { RatingModule } from './rating/rating.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ReportModule } from './report/report.module';
import { RateLimitMiddleware } from './common/rate-limit.middleware';
import { TransformInterceptor } from './common/transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // <-- enable cron jobs
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME || 'lelodedo',
      autoLoadEntities: true,
      synchronize: true,
    }),

    UserModule,
    ToolCategoryModule,
    ItemModule,
    BorrowRequestModule,
    MessageModule,
    RatingModule,
    AuthModule,
    AdminModule,
    ReportModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
