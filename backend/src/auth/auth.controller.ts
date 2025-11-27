import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // REGISTER
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // LOGIN
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // GET CURRENT USER (JWT protected)
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req) {
    return req.user;   // <-- comes from JwtStrategy.validate()
  }

  // PASSWORD RESET REQUEST
  @Post('password-reset-request')
  requestPasswordReset(@Body() dto: PasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  // PASSWORD RESET
  @Post('password-reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.reset_token, dto.new_password);
  }
}
