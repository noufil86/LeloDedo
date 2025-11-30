// src/borrow-request/borrow-request.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BorrowRequest } from './borrow-request.entity';
import { User } from '../user/user.entity';
import { Item } from '../item/item.entity';
import { ItemService } from '../item/item.service';

import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BorrowRequestService {
  constructor(
    @InjectRepository(BorrowRequest)
    private repo: Repository<BorrowRequest>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Item)
    private itemRepo: Repository<Item>,

    private itemService: ItemService,
  ) {}

  // -------------------------
  // Scheduled auto-update: mark overdue APPROVED requests as COMPLETED
  // Runs every minute (adjust CronExpression as needed)
  // -------------------------
  @Cron(CronExpression.EVERY_MINUTE)
  async autoUpdateCompleted() {
    const now = new Date();

    const active = await this.repo.find({
      where: { status: 'APPROVED' },
      relations: ['item'],
    });

    for (const req of active) {
      if (req.end_date && new Date(req.end_date) < now) {
        req.status = 'COMPLETED';
        // centralize via itemService
        try {
          await this.itemService.markAvailableById(req.item.item_id);
        } catch (err) {
          // if item not found, still mark request completed to avoid stuck states
        }
        await this.repo.save(req);
      }
    }
  }

  // -------------------------
  // CREATE REQUEST
  // -------------------------
  async create(dto: { item_id: number; duration_days?: number; start_date?: string; end_date?: string }, borrower_id: number) {
    // validate borrower
    const borrower = await this.userRepo.findOne({
      where: { user_id: borrower_id },
    });
    if (!borrower) throw new NotFoundException('Borrower not found');

    // Check for overdue items
    const now = new Date();
    const overdue = await this.repo.findOne({
      where: {
        borrower: { user_id: borrower_id },
        status: 'APPROVED',
      },
      relations: ['item', 'lender'],
    });
    if (overdue && overdue.end_date && new Date(overdue.end_date) < now) {
      throw new ForbiddenException(
        'You have overdue items. Please return them before requesting new items.',
      );
    }

    // load item with owner
    const item = await this.itemRepo.findOne({
      where: { item_id: dto.item_id },
      relations: ['owner'],
    });
    if (!item) throw new NotFoundException('Item not found');

    if (item.owner.user_id === borrower_id)
      throw new ForbiddenException('You cannot request your own item');

    if (item.availability_status !== 'AVAILABLE')
      throw new BadRequestException('This item is not available');

    // Prevent active overlapping requests (PENDING or APPROVED)
    const whereArray = ['PENDING', 'APPROVED'].map((status) => ({
      item: { item_id: item.item_id },
      status: status as any,
    })) as any;

    const existingCount = await this.repo.count({ where: whereArray });
    if (existingCount > 0) {
      throw new BadRequestException('Another active request already exists for this item');
    }

    // Determine dates: use provided dates or auto-calculate
    let start: Date;
    let end: Date;
    
    if (dto.start_date && dto.end_date) {
      start = new Date(dto.start_date);
      end = new Date(dto.end_date);
    } else {
      start = new Date();
      end = new Date(start);
      end.setDate(end.getDate() + (dto.duration_days ?? 3));
    }

    const request = this.repo.create({
      borrower,
      lender: item.owner,
      item,
      start_date: start,
      end_date: end,
      status: 'PENDING',
    });

    return this.repo.save(request);
  }

  // -------------------------
  // SENT REQUESTS (borrower)
  // -------------------------
  async myRequests(user_id: number) {
    // keep DB clean — scheduled job runs always, but keep call here too for safety
    await this.autoUpdateCompleted();

    return this.repo.find({
      where: { borrower: { user_id } },
      relations: ['item', 'lender', 'borrower'],
    });
  }

  // -------------------------
  // INCOMING REQUESTS (lender)
  // -------------------------
  async myIncoming(user_id: number) {
    await this.autoUpdateCompleted();

    return this.repo.find({
      where: { lender: { user_id } },
      relations: ['item', 'lender', 'borrower'],
    });
  }

  // -------------------------
  // APPROVE (lender)
  // -------------------------
  async approve(id: number, lender_id: number) {
    const req = await this.repo.findOne({
      where: { request_id: id },
      relations: ['item', 'lender'],
    });

    if (!req) throw new NotFoundException('Request not found');
    if (req.lender.user_id !== lender_id) throw new ForbiddenException('You do not own this item');
    if (req.status !== 'PENDING') throw new BadRequestException('Only pending requests can be approved');

    req.status = 'APPROVED';
    // centralize via itemService: mark item as UNAVAILABLE
    await this.itemService.markUnavailableById(req.item.item_id);

    return this.repo.save(req);
  }

  // -------------------------
  // DECLINE (lender)
  // -------------------------
  async decline(id: number, lender_id: number) {
    const req = await this.repo.findOne({
      where: { request_id: id },
      relations: ['lender'],
    });

    if (!req) throw new NotFoundException('Request not found');
    if (req.lender.user_id !== lender_id) throw new ForbiddenException('You do not own this item');

    req.status = 'DECLINED';
    return this.repo.save(req);
  }

  // -------------------------
  // CANCEL (borrower cancels PENDING)
  // -------------------------
  async cancel(id: number, borrower_id: number) {
    const req = await this.repo.findOne({
      where: { request_id: id },
      relations: ['borrower'],
    });

    if (!req) throw new NotFoundException('Request not found');
    if (req.borrower.user_id !== borrower_id) throw new ForbiddenException('Not your request');
    if (req.status !== 'PENDING') throw new BadRequestException('Only pending requests can be cancelled');

    req.status = 'DECLINED';
    return this.repo.save(req);
  }

  // -------------------------
  // BORROWER REQUESTS RETURN
  // -------------------------
  async returnRequest(id: number, borrower_id: number) {
    const req = await this.repo.findOne({
      where: { request_id: id },
      relations: ['borrower'],
    });

    if (!req) throw new NotFoundException('Request not found');
    if (req.borrower.user_id !== borrower_id) throw new ForbiddenException('Not your request');
    if (req.status !== 'APPROVED') throw new BadRequestException('Item is not currently borrowed');

    req.status = 'RETURN_REQUESTED';
    return this.repo.save(req);
  }

  // -------------------------
  // LENDER CONFIRMS RETURN
  // -------------------------
  async confirmReturn(id: number, lender_id: number) {
    const req = await this.repo.findOne({
      where: { request_id: id },
      relations: ['lender', 'item'],
    });

    if (!req) throw new NotFoundException('Request not found');
    if (req.lender.user_id !== lender_id) throw new ForbiddenException('Not your item');
    if (req.status !== 'RETURN_REQUESTED') throw new BadRequestException('Borrower has not requested a return');

    req.status = 'COMPLETED';
    // centralize via itemService
    await this.itemService.markAvailableById(req.item.item_id);

    return this.repo.save(req);
  }

  // -------------------------
  // BORROWER REQUESTS EXTENSION
  // -------------------------
  async requestExtension(id: number, borrower_id: number, extension_days: number) {
    const req = await this.repo.findOne({
      where: { request_id: id },
      relations: ['borrower'],
    });

    if (!req) throw new NotFoundException('Request not found');
    if (req.borrower.user_id !== borrower_id) throw new ForbiddenException('Not your request');
    if (req.status !== 'APPROVED') throw new BadRequestException('Item is not currently borrowed');

    if (extension_days < 1 || extension_days > 30) {
      throw new BadRequestException('Extension must be between 1 and 30 days');
    }

    const newEndDate = new Date(req.end_date);
    newEndDate.setDate(newEndDate.getDate() + extension_days);

    req.extension_requested = true;
    req.extension_requested_until = newEndDate;
    req.extension_requested_at = new Date();

    return this.repo.save(req);
  }

  // -------------------------
  // LENDER APPROVES EXTENSION
  // -------------------------
  async approveExtension(id: number, lender_id: number) {
    const req = await this.repo.findOne({
      where: { request_id: id },
      relations: ['lender'],
    });

    if (!req) throw new NotFoundException('Request not found');
    if (req.lender.user_id !== lender_id) throw new ForbiddenException('Not your item');
    if (!req.extension_requested) throw new BadRequestException('No extension request pending');

    // Update end_date to the requested extension date
    req.end_date = req.extension_requested_until;
    req.extension_requested = false;
    req.extension_requested_until = null;
    req.extension_requested_at = null;

    return this.repo.save(req);
  }

  // -------------------------
  // LENDER DECLINES EXTENSION
  // -------------------------
  async declineExtension(id: number, lender_id: number) {
    const req = await this.repo.findOne({
      where: { request_id: id },
      relations: ['lender'],
    });

    if (!req) throw new NotFoundException('Request not found');
    if (req.lender.user_id !== lender_id) throw new ForbiddenException('Not your item');
    if (!req.extension_requested) throw new BadRequestException('No extension request pending');

    req.extension_requested = false;
    req.extension_requested_until = null;
    req.extension_requested_at = null;

    return this.repo.save(req);
  }

  async adminCountActiveBorrows() {
    return this.repo.count({ where: { status: 'APPROVED' } });
  }

  async adminCountPendingRequests() {
    return this.repo.count({ where: { status: 'PENDING' } });
  }

  async adminFindOverdue() {
    return this.repo.find({
      where: { status: 'APPROVED' },
      relations: ['borrower', 'item', 'lender'],
    });
  }
}
