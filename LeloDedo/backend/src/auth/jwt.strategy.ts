import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'defaultsecret',
    });
  }

  async validate(payload: any) {
    // Fetch full user from database
    const user = await this.userService.findById(payload.sub);
    
    if (!user) {
      return null;
    }

    return {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone_number: user.phone_number,
      verified_status: user.verified_status,
      email_verified: user.email_verified,
      average_rating: user.average_rating,
      warning_count: user.warning_count,
    };
  }
}
