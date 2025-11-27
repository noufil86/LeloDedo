import { Controller, Get, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id/profile')
  async getUserProfile(@Param('id', ParseIntPipe) userId: number) {
    const profile = await this.userService.getUserProfile(userId);
    if (!profile) {
      throw new NotFoundException('User not found');
    }
    return profile;
  }
}

