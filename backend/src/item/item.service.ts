// src/item/item.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Item } from './item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

import { User } from '../user/user.entity';
import { ToolCategory } from '../tool-category/tool-category.entity';
import { BorrowRequest } from '../borrow-request/borrow-request.entity';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private repo: Repository<Item>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(ToolCategory)
    private categoryRepo: Repository<ToolCategory>,

    @InjectRepository(BorrowRequest)
    private requestRepo: Repository<BorrowRequest>,
  ) {}

  // -------------------------
  // CHECK IF ITEM HAS ACTIVE BORROW
  // ACTIVE = PENDING | APPROVED | RETURN_REQUESTED
  // -------------------------
  private async hasActiveBorrow(item_id: number): Promise<boolean> {
    const activeStatuses = ['PENDING', 'APPROVED', 'RETURN_REQUESTED'];

    const whereArray = activeStatuses.map((status) => ({
      item: { item_id },
      status: status as any,
    })) as any;

    const count = await this.requestRepo.count({ where: whereArray });
    return count > 0;
  }

  // -------------------------
  // CREATE ITEM
  // -------------------------
  async create(dto: CreateItemDto, owner_id: number) {
    const owner = await this.userRepo.findOne({
      where: { user_id: owner_id },
    });

    if (!owner) throw new NotFoundException('Owner not found');

    const category = await this.categoryRepo.findOne({
      where: { category_id: dto.category_id },
    });

    if (!category) throw new NotFoundException('Category not found');

    const item = this.repo.create({
      title: dto.title,
      description: dto.description,
      image_url: dto.image_url,
      owner,
      category,
      availability_status: 'AVAILABLE',
    });

    return this.repo.save(item);
  }

  // -------------------------
  // GET ALL ITEMS
  // -------------------------
  findAll() {
    return this.repo.find({ relations: ['owner', 'category'] });
  }

  // -------------------------
  // GET ONE ITEM
  // -------------------------
  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { item_id: id },
      relations: ['owner', 'category'],
    });

    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  // -------------------------
  // UPDATE (ONLY OWNER, NOT IF ACTIVE BORROW EXISTS)
  // -------------------------
  async update(id: number, dto: UpdateItemDto, user_id: number) {
    const item = await this.findOne(id);

    if (item.owner.user_id !== user_id) {
      throw new ForbiddenException('You cannot edit an item you do not own');
    }

    if (await this.hasActiveBorrow(id)) {
      throw new BadRequestException(
        'Cannot update an item that is currently borrowed or has an active request',
      );
    }

    if (dto.category_id) {
      const category = await this.categoryRepo.findOne({
        where: { category_id: dto.category_id },
      });

      if (!category) throw new NotFoundException('Category not found');
      item.category = category;
    }

    Object.assign(item, dto);
    return this.repo.save(item);
  }

  // -------------------------
  // DELETE (ONLY OWNER, NOT IF ACTIVE BORROW EXISTS)
  // -------------------------
  async remove(id: number, user_id: number) {
    const item = await this.findOne(id);

    if (item.owner.user_id !== user_id) {
      throw new ForbiddenException('You cannot delete an item you do not own');
    }

    if (await this.hasActiveBorrow(id)) {
      throw new BadRequestException('Cannot delete item while an active borrow exists');
    }

    return this.repo.remove(item);
  }

  // -------------------------
  // MARK UNAVAILABLE (WHEN APPROVED)
  // -------------------------
  async markUnavailableById(item_id: number) {
    const item = await this.repo.findOne({ where: { item_id } });
    if (!item) throw new NotFoundException('Item not found');

    if (item.availability_status === 'REMOVED') {
      throw new BadRequestException('Item is removed and cannot be borrowed');
    }

    item.availability_status = 'UNAVAILABLE';
    return this.repo.save(item);
  }

  // -------------------------
  // MARK AVAILABLE (WHEN RETURNED / COMPLETED)
  // -------------------------
  async markAvailableById(item_id: number) {
    const item = await this.repo.findOne({ where: { item_id } });
    if (!item) throw new NotFoundException('Item not found');

    item.availability_status = 'AVAILABLE';
    return this.repo.save(item);
  }

  // -------------------------
  // IMAGE MANAGEMENT
  // -------------------------
  async addItemImage(id: number, imageUrl: string, user_id: number) {
    const item = await this.findOne(id);

    if (item.owner.user_id !== user_id) {
      throw new ForbiddenException('You cannot modify an item you do not own');
    }

    // Initialize image_urls array if not present
    if (!item.image_urls) {
      item.image_urls = [];
    }

    // Add image to gallery (max 5 images)
    if (item.image_urls.length >= 5) {
      throw new BadRequestException('Maximum 5 images per item');
    }

    item.image_urls.push(imageUrl);

    // Set as primary image if it's the first one
    if (!item.image_url) {
      item.image_url = imageUrl;
    }

    return this.repo.save(item);
  }

  // -------------------------
  // SEARCH & FILTER
  // -------------------------
  async search(filters: {
    title?: string;
    category_id?: number;
    availability_status?: string;
    owner_id?: number;
    min_rating?: number;
  }) {
    let query = this.repo.createQueryBuilder('item')
      .leftJoinAndSelect('item.owner', 'owner')
      .leftJoinAndSelect('item.category', 'category');

    if (filters.title) {
      query = query.where('item.title ILIKE :title', { title: `%${filters.title}%` });
    }

    if (filters.category_id) {
      query = query.andWhere('item.category_id = :categoryId', { categoryId: filters.category_id });
    }

    if (filters.availability_status) {
      query = query.andWhere('item.availability_status = :status', { status: filters.availability_status });
    }

    if (filters.owner_id) {
      query = query.andWhere('item.owner_id = :ownerId', { ownerId: filters.owner_id });
    }

    if (filters.min_rating !== undefined) {
      query = query.andWhere('owner.average_rating >= :minRating', { minRating: filters.min_rating });
    }

    return query.orderBy('item.title', 'ASC').getMany();
  }

  // PUBLIC WRAPPERS FOR ADMIN ACCESS
  async adminCountItems() {
    return this.repo.count();
  }

  async adminFindAllItems() {
    return this.repo.find();
  }
}

