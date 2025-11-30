import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  // REGISTER
  async register(dto: RegisterDto) {
    const hashed = await bcrypt.hash(dto.password, 10);

    const newuser = await this.userService.create({
      name: dto.name,
      email: dto.email,
      password_hash: hashed,
      phone_number: dto.phone_number,
      role: dto.role ?? 'BORROWER',
    });

    // Dummy email verification simulation
    // In production, send actual verification email
    await this.userService.simulateEmailVerification(newuser.user_id);

    return {
      message: 'User registered successfully',
      user: {
        user_id: newuser.user_id,
        name: newuser.name,
        email: newuser.email,
        role: newuser.role,
        email_verified: true, // Dummy verification
      },
    };
  }

  // LOGIN
  async login(dto: LoginDto) {
    this.logger.log(`🔍 LOGIN ATTEMPT: email=${dto.email}`);
    
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      this.logger.warn(`❌ USER NOT FOUND: email=${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`✅ USER FOUND: user_id=${user.user_id}, email=${user.email}`);
    this.logger.log(`📋 USER STATUS: verified_status=${user.verified_status}, email_verified=${user.email_verified}, password_hash=${user.password_hash ? 'SET' : 'MISSING'}`);

    // Check if user is verified by admin
    if (!user.verified_status) {
      this.logger.warn(`🚫 USER NOT VERIFIED BY ADMIN: user_id=${user.user_id}`);
      throw new UnauthorizedException(
        'Your account is pending admin verification. Please wait for approval.',
      );
    }
    this.logger.log(`✅ VERIFICATION CHECK PASSED`);

    // Check if user is banned
    const isBanned = await this.userService.isUserBanned(user.user_id);
    this.logger.log(`🔍 BAN CHECK: isBanned=${isBanned}`);
    
    if (isBanned) {
      this.logger.warn(`🚫 USER IS BANNED: user_id=${user.user_id}, ban_until=${user.ban_until?.toISOString()}`);
      throw new UnauthorizedException(
        `User is banned. Ban expires at: ${user.ban_until?.toISOString()}`,
      );
    }
    this.logger.log(`✅ BAN CHECK PASSED`);

    this.logger.log(`🔐 PASSWORD COMPARISON: comparing provided password with hash=${user.password_hash.substring(0, 20)}...`);
    const match = await bcrypt.compare(dto.password, user.password_hash);
    this.logger.log(`🔐 PASSWORD MATCH RESULT: ${match}`);
    
    if (!match) {
      this.logger.warn(`❌ PASSWORD MISMATCH: user_id=${user.user_id}, provided_password_length=${dto.password.length}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`✅ PASSWORD VERIFIED`);

    const payload = {
      sub: user.user_id,
      email: user.email,
      role: user.role,
    };

    this.logger.log(`🔑 GENERATING JWT: user_id=${user.user_id}, role=${user.role}`);
    const token = await this.jwtService.signAsync(payload);
    this.logger.log(`✅ LOGIN SUCCESSFUL: user_id=${user.user_id}, token_length=${token.length}`);

    return { access_token: token };
  }

  // PASSWORD RESET - REQUEST
  async requestPasswordReset(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      // Don't expose whether email exists (security)
      return { message: 'If email exists, reset token has been sent' };
    }

    const resetToken = await this.userService.generatePasswordResetToken(user.user_id);

    // In production, send email with reset token
    // For now, return token (remove in production)
    return {
      message: 'Password reset token generated',
      reset_token: resetToken, // Remove this in production!
      expires_in: '30 minutes',
    };
  }

  // PASSWORD RESET - RESET
  async resetPassword(token: string, newPassword: string) {
    if (!token || token.length < 10) {
      throw new BadRequestException('Invalid reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await this.userService.resetPassword(token, hashedPassword);

    return { message: 'Password reset successfully', user_id: user.user_id };
  }
}
