import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UserService } from '../user/user.service';
import { ItemService } from '../item/item.service';
import { BorrowRequestService } from '../borrow-request/borrow-request.service';
import { ToolCategoryService } from '../tool-category/tool-category.service';
import { Conversation } from '../message/conversation.entity';
import { Message } from '../message/message.entity';
import { BorrowRequest } from '../borrow-request/borrow-request.entity';
import { User } from '../user/user.entity';
import { Item } from '../item/item.entity';
import { Rating } from '../rating/rating.entity';

@Injectable()
export class AdminService {
  constructor(
    private userService: UserService,
    private itemService: ItemService,
    private borrowService: BorrowRequestService,
    private categoryService: ToolCategoryService,
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(BorrowRequest)
    private borrowRepo: Repository<BorrowRequest>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(Rating)
    private ratingRepo: Repository<Rating>,
  ) {}

  // -------------------------
  // USER MANAGEMENT
  // -------------------------

  async findAllUsers() {
    return this.userService.adminFindAll();
  }

  async findUser(id: number) {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserRole(id: number, role: string) {
    return this.userService.update(id, { role });
  }

  async suspendUser(id: number, reason: string) {
    return this.userService.update(id, {
      verified_status: false,
      suspension_reason: reason,
    } as any);
  }

  async unsuspendUser(id: number) {
    return this.userService.update(id, {
      verified_status: true,
      suspension_reason: null,
    } as any);
  }

  async verifyUser(id: number) {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.userService.update(id, {
      verified_status: true,
    } as any);
  }

  async warnUser(id: number, reason: string) {
    return this.userService.warnUser(id, reason);
  }

  async banUser(id: number, durationDays: number, reason: string) {
    return this.userService.banUser(id, durationDays, reason);
  }

  async unbanUser(id: number) {
    return this.userService.unbanUser(id);
  }

  async deleteUser(id: number) {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.userService.deleteUser(user);
  }

  // -------------------------
  // USER SEARCH
  // -------------------------
  async searchUsers(filters: {
    name?: string;
    email?: string;
    role?: string;
    warning_count?: number;
    banned?: boolean;
  }) {
    let query = this.userRepo.createQueryBuilder('user');

    if (filters.name) {
      query = query.where('user.name ILIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.email) {
      query = query.andWhere('user.email ILIKE :email', { email: `%${filters.email}%` });
    }

    if (filters.role) {
      query = query.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters.warning_count !== undefined) {
      query = query.andWhere('user.warning_count >= :warningCount', { warningCount: filters.warning_count });
    }

    if (filters.banned !== undefined) {
      if (filters.banned) {
        query = query.andWhere('user.ban_until > NOW()');
      } else {
        query = query.andWhere('(user.ban_until IS NULL OR user.ban_until <= NOW())');
      }
    }

    return query.orderBy('user.name', 'ASC').getMany();
  }

  // -------------------------
  // ANALYTICS
  // -------------------------

  async systemStats() {
    const now = new Date();
    const usersWithOverdue = await this.borrowRepo
      .createQueryBuilder('request')
      .select('COUNT(DISTINCT request.borrower_id)', 'count')
      .where('request.status = :status', { status: 'APPROVED' })
      .andWhere('request.end_date < :now', { now })
      .getRawOne();

    return {
      users: await this.userService.adminCountAll(),
      admins: await this.userService.adminCountByRole('ADMIN'),
      lenders: await this.userService.adminCountByRole('LENDER'),
      borrowers: await this.userService.adminCountByRole('BORROWER'),

      items: await this.itemService.adminCountItems(),
      categories: await this.categoryService.adminCountCategories(),

      activeBorrows: await this.borrowService.adminCountActiveBorrows(),
      pendingRequests: await this.borrowService.adminCountPendingRequests(),
      usersWithOverdue: parseInt(usersWithOverdue?.count || '0', 10),
    };
  }

  async listOverdue() {
    return this.borrowService.adminFindOverdue();
  }

  // -------------------------
  // MESSAGING AUDIT
  // -------------------------

  async viewAllConversations() {
    return this.conversationRepo.find({
      relations: ['borrower', 'lender', 'borrow_request', 'messages'],
      order: { created_at: 'DESC' },
    });
  }

  async viewConversation(conversationId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { conversation_id: conversationId },
      relations: ['borrower', 'lender', 'borrow_request', 'messages'],
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async viewConversationByBorrowRequest(borrowRequestId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { borrow_request: { request_id: borrowRequestId } },
      relations: ['borrower', 'lender', 'borrow_request', 'messages'],
    });

    if (!conversation) throw new NotFoundException('No conversation found for this borrow request');
    return conversation;
  }

  async viewMessagesBetweenUsers(borrowerId: number, lenderId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: {
        borrower: { user_id: borrowerId },
        lender: { user_id: lenderId },
      },
      relations: ['messages'],
    });

    if (!conversation) throw new NotFoundException('No conversation between these users');
    return conversation.messages;
  }

  async viewUserConversations(userId: number) {
    return this.conversationRepo.find({
      where: [
        { borrower: { user_id: userId } },
        { lender: { user_id: userId } },
      ],
      relations: ['borrower', 'lender', 'borrow_request', 'messages'],
      order: { created_at: 'DESC' },
    });
  }

  // -------------------------
  // ANALYTICS
  // -------------------------

  async getTopBorrowedItems(limit = 10) {
    return this.borrowRepo
      .createQueryBuilder('request')
      .select('item.item_id', 'item_id')
      .addSelect('item.title', 'title')
      .addSelect('COUNT(request.request_id)', 'borrow_count')
      .leftJoin('request.item', 'item')
      .where('request.status = :status', { status: 'COMPLETED' })
      .groupBy('item.item_id')
      .addGroupBy('item.title')
      .orderBy('borrow_count', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getActiveLenders(limit = 10) {
    return this.borrowRepo
      .createQueryBuilder('request')
      .select('user.user_id', 'user_id')
      .addSelect('user.name', 'name')
      .addSelect('user.email', 'email')
      .addSelect('COUNT(request.request_id)', 'completed_borrows')
      .addSelect('AVG(CAST(rating.score AS FLOAT))', 'avg_rating')
      .leftJoin('request.lender', 'user')
      .leftJoin('rating', 'rating', 'rating.given_to = user.user_id')
      .where('request.status = :status', { status: 'COMPLETED' })
      .groupBy('user.user_id')
      .addGroupBy('user.name')
      .addGroupBy('user.email')
      .orderBy('completed_borrows', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getOverdueRate() {
    const now = new Date();
    const totalApproved = await this.borrowRepo.count({
      where: { status: 'APPROVED' },
    });

    const overdueCount = await this.borrowRepo.count({
      where: {
        status: 'APPROVED',
      },
    });

    // Count those with end_date < now
    const overdueWithPastDate = await this.borrowRepo
      .createQueryBuilder('request')
      .where('request.status = :status', { status: 'APPROVED' })
      .andWhere('request.end_date < :now', { now })
      .getCount();

    const rate = totalApproved > 0 ? ((overdueWithPastDate / totalApproved) * 100).toFixed(2) : '0.00';

    return {
      total_approved: totalApproved,
      overdue_count: overdueWithPastDate,
      overdue_rate_percent: parseFloat(rate),
    };
  }

  async getDailySignups(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.userRepo
      .createQueryBuilder('user')
      .select("DATE(user.created_at)", 'date')
      .addSelect('COUNT(user.user_id)', 'signup_count')
      .where('user.created_at >= :startDate', { startDate })
      .groupBy("DATE(user.created_at)")
      .orderBy("DATE(user.created_at)", 'ASC')
      .getRawMany();
  }

  async getItemsByCategory() {
    return this.borrowRepo
      .createQueryBuilder('request')
      .select('category.category_id', 'category_id')
      .addSelect('category.category_name', 'category_name')
      .addSelect('COUNT(request.request_id)', 'borrow_count')
      .addSelect('COUNT(DISTINCT request.item_id)', 'item_count')
      .leftJoin('request.item', 'item')
      .leftJoin('item.category', 'category')
      .where('request.status = :status', { status: 'COMPLETED' })
      .groupBy('category.category_id')
      .addGroupBy('category.category_name')
      .orderBy('borrow_count', 'DESC')
      .getRawMany();
  }

  async getBorrowSuccessRate() {
    const total = await this.borrowRepo.count();

    const completed = await this.borrowRepo.count({
      where: { status: 'COMPLETED' },
    });

    const declined = await this.borrowRepo.count({
      where: { status: 'DECLINED' },
    });

    const successRate = total > 0 ? ((completed / total) * 100).toFixed(2) : '0.00';
    const declineRate = total > 0 ? ((declined / total) * 100).toFixed(2) : '0.00';

    return {
      total_requests: total,
      completed_requests: completed,
      declined_requests: declined,
      success_rate_percent: parseFloat(successRate),
      decline_rate_percent: parseFloat(declineRate),
    };
  }

  async getAverageBorrowDuration() {
    const result = await this.borrowRepo
      .createQueryBuilder('request')
      .select('AVG(DATEDIFF(request.end_date, request.start_date))', 'avg_duration_days')
      .where('request.status = :status', { status: 'COMPLETED' })
      .getRawOne();

    return {
      average_borrow_duration_days: Math.round(parseFloat(result?.avg_duration_days || 0)),
    };
  }

  async getMostActiveBorrowers(limit = 10) {
    return this.borrowRepo
      .createQueryBuilder('request')
      .select('user.user_id', 'user_id')
      .addSelect('user.name', 'name')
      .addSelect('user.email', 'email')
      .addSelect('COUNT(request.request_id)', 'total_borrows')
      .addSelect('COUNT(CASE WHEN request.status = :completed THEN 1 END)', 'completed_borrows')
      .addSelect('AVG(CAST(rating.score AS FLOAT))', 'avg_rating_received')
      .leftJoin('request.borrower', 'user')
      .leftJoin('rating', 'rating', 'rating.given_to = user.user_id')
      .groupBy('user.user_id')
      .addGroupBy('user.name')
      .addGroupBy('user.email')
      .orderBy('total_borrows', 'DESC')
      .setParameter('completed', 'COMPLETED')
      .limit(limit)
      .getRawMany();
  }

  async getUserGrowthMetrics() {
    const totalUsers = await this.userRepo.count();

    const totalLenders = await this.userRepo.count({
      where: { role: 'LENDER' },
    });

    const totalBorrowers = await this.userRepo.count({
      where: { role: 'BORROWER' },
    });

    const totalAdmins = await this.userRepo.count({
      where: { role: 'ADMIN' },
    });

    return {
      total_users: totalUsers,
      total_lenders: totalLenders,
      total_borrowers: totalBorrowers,
      total_admins: totalAdmins,
      lender_percentage: ((totalLenders / totalUsers) * 100).toFixed(2),
      borrower_percentage: ((totalBorrowers / totalUsers) * 100).toFixed(2),
    };
  }

  async getItemAvailabilityStats() {
    const total = await this.itemRepo.count();

    const available = await this.itemRepo.count({
      where: { availability_status: 'AVAILABLE' },
    });

    const unavailable = await this.itemRepo.count({
      where: { availability_status: 'UNAVAILABLE' },
    });

    const removed = await this.itemRepo.count({
      where: { availability_status: 'REMOVED' },
    });

    return {
      total_items: total,
      available_items: available,
      unavailable_items: unavailable,
      removed_items: removed,
      availability_rate_percent: total > 0 ? ((available / total) * 100).toFixed(2) : '0.00',
    };
  }
}
