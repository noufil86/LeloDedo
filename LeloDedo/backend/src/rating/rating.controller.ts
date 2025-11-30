import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RatingService } from './rating.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('rating')
export class RatingController {
  constructor(private ratingService: RatingService) {}

  @Post(':requestId')
  @UseGuards(AuthGuard('jwt'))
  createRating(
    @Param('requestId') requestId: number,
    @Body() body: { score: number; review?: string },
    @Req() req,
  ) {
    return this.ratingService.createRating(requestId, req.user.user_id, body.score, body.review);
  }

  @Get('user/:userId')
  getRatings(@Param('userId') userId: number) {
    return this.ratingService.getRatingsForUser(userId);
  }

  @Get('user/:userId/average')
  getAverageRating(@Param('userId') userId: number) {
    return this.ratingService.getAverageRating(userId);
  }
}
