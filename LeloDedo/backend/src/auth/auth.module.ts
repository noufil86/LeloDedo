import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';

import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule,     // allow access to .env
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultsecret',
      signOptions: {
       expiresIn: Number(process.env.JWT_EXPIRES_IN) || 86400,  // 24 hours

      },
    }),
  ],
  providers: [AuthService, JwtStrategy, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, RolesGuard],
})
export class AuthModule {}
