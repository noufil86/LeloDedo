import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import * as crypto from 'crypto';

import { User } from './user.entity';
import { BorrowRequest } from '../borrow-request/borrow-request.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(BorrowRequest)
    private borrowRepo: Repository<BorrowRequest>,
  ) {}

  // CREATE USER (used by AuthService)
  async create(data: Partial<User>): Promise<User> {
    const newUser = this.userRepo.create(data);
    return await this.userRepo.save(newUser);
  }

  // FIND USER BY EMAIL
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepo.findOne({
      where: { email },
    });
  }

  // FIND USER BY ID
  async findById(id: number): Promise<User | null> {
    return await this.userRepo.findOne({
      where: { user_id: id },
      relations: ['items'],
    });
  }

  // UPDATE USER (optional)
  async update(id: number, data: Partial<User>): Promise<User> {
    await this.userRepo.update(id, data);
    return this.findById(id);
  }

  // Check if user has overdue items
  async hasOverdue(userId: number): Promise<boolean> {
    const now = new Date();
    const overdue = await this.borrowRepo.findOne({
      where: {
        borrower: { user_id: userId },
        status: 'APPROVED',
        end_date: LessThan(now),
      },
    });
    return !!overdue;
  }

  // Get user profile with stats
  async getUserProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { user_id: userId },
      relations: ['items'],
    });

    if (!user) return null;

    const completedBorrows = await this.borrowRepo.count({
      where: {
        borrower: { user_id: userId },
        status: 'COMPLETED',
      },
    });

    const completedLends = await this.borrowRepo.count({
      where: {
        lender: { user_id: userId },
        status: 'COMPLETED',
      },
    });

    const hasOverdue = await this.hasOverdue(userId);

    return {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      average_rating: user.average_rating,
      completed_borrows: completedBorrows,
      completed_lends: completedLends,
      items_owned: user.items.length,
      has_overdue: hasOverdue,
      verified_status: user.verified_status,
    };
  }

  // -------------------------
  // BAN & WARNING MANAGEMENT
  // -------------------------

  async warnUser(userId: number, reason: string) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    user.warning_count = (user.warning_count || 0) + 1;

    // Auto-ban after 3 warnings (7 days)
    if (user.warning_count >= 3) {
      user.ban_reason = reason || `Auto-banned after ${user.warning_count} warnings`;
      user.ban_until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    return this.userRepo.save(user);
  }

  async banUser(userId: number, durationDays: number, reason: string) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    user.ban_reason = reason;
    user.ban_until = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    return this.userRepo.save(user);
  }

  async unbanUser(userId: number) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    user.ban_until = null;
    user.ban_reason = null;

    return this.userRepo.save(user);
  }

  async isUserBanned(userId: number): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) return false;

    if (!user.ban_until) return false;

    const now = new Date();
    return user.ban_until > now;
  }

  // -------------------------
  // PASSWORD RESET
  // -------------------------

  async generatePasswordResetToken(userId: number): Promise<string> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    user.password_reset_token = hashedToken;
    user.password_reset_expires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await this.userRepo.save(user);

    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userRepo.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: MoreThan(new Date()),
      },
    });

    if (!user) throw new Error('Invalid or expired reset token');

    // Password would be hashed by caller (AuthService)
    user.password_hash = newPassword;
    user.password_reset_token = null;
    user.password_reset_expires = null;

    return this.userRepo.save(user);
  }

  // DUMMY EMAIL VERIFICATION SIMULATION
  // In production, this would send actual verification email
  async simulateEmailVerification(userId: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    // Simulate instant email verification
    user.email_verified = true;
    user.email_verified_at = new Date();

    return this.userRepo.save(user);
  }

  async adminCountAll() {
    return this.userRepo.count();
  }

  async adminCountByRole(role: string) {
    return this.userRepo.count({ where: { role } });
  }

  async adminFindAll() {
    return this.userRepo.find();
  }

  async deleteUser(user: User) {
    return this.userRepo.remove(user);
  }
}