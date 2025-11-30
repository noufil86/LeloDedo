import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';
import { BorrowRequest } from '../borrow-request/borrow-request.entity';
import { User } from '../user/user.entity';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private ratingRepo: Repository<Rating>,
    @InjectRepository(BorrowRequest)
    private borrowRepo: Repository<BorrowRequest>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async createRating(requestId: number, giverId: number, score: number, review?: string) {
    // Validate score
    if (score < 1 || score > 5) {
      throw new BadRequestException('Rating score must be between 1 and 5');
    }

    // Find borrow request
    const request = await this.borrowRepo.findOne({
      where: { request_id: requestId },
      relations: ['borrower', 'lender'],
    });
    if (!request) throw new NotFoundException('Borrow request not found');

    // Check if request is completed
    if (request.status !== 'COMPLETED') {
      throw new BadRequestException('Can only rate completed borrow requests');
    }

    // Verify giver is borrower or lender
    const isValid = request.borrower.user_id === giverId || request.lender.user_id === giverId;
    if (!isValid) throw new BadRequestException('Only borrower or lender can rate');

    // Determine recipient
    const givenTo = request.borrower.user_id === giverId ? request.lender : request.borrower;

    // Check for duplicate rating
    const existing = await this.ratingRepo.findOne({
      where: {
        request: { request_id: requestId },
        given_by: { user_id: giverId },
      },
    });
    if (existing) throw new ConflictException('You have already rated this transaction');

    // Create rating
    const rating = this.ratingRepo.create({
      request,
      given_by: { user_id: giverId } as any,
      given_to: givenTo,
      score,
      review: review || null,
    });

    const saved = await this.ratingRepo.save(rating);

    // Update average rating
    await this.updateUserAverageRating(givenTo.user_id);

    return saved;
  }

  async getRatingsForUser(userId: number) {
    return this.ratingRepo.find({
      where: { given_to: { user_id: userId } },
      relations: ['given_by', 'request'],
      order: { created_at: 'DESC' },
    });
  }

  async getAverageRating(userId: number) {
    const ratings = await this.ratingRepo.find({
      where: { given_to: { user_id: userId } },
    });

    if (ratings.length === 0) return null;

    const sum = ratings.reduce((acc, r) => acc + r.score, 0);
    return Number((sum / ratings.length).toFixed(2));
  }

  async updateUserAverageRating(userId: number) {
    const avg = await this.getAverageRating(userId);
    await this.userRepo.update(userId, { average_rating: avg });
  }
}
