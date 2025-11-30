import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ToolCategory } from './tool-category.entity';
import { CreateToolCategoryDto } from './dto/create-tool-category.dto';
import { UpdateToolCategoryDto } from './dto/update-tool-category.dto';

@Injectable()
export class ToolCategoryService {
  constructor(
    @InjectRepository(ToolCategory)
    private repo: Repository<ToolCategory>,
  ) {}

  // CREATE
  create(dto: CreateToolCategoryDto) {
    const category = this.repo.create(dto);
    return this.repo.save(category);
  }

  // GET ALL
  findAll() {
    return this.repo.find();
  }

  // GET ONE
  async findOne(id: number) {
    const category = await this.repo.findOne({ where: { category_id: id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // UPDATE
  async update(id: number, dto: UpdateToolCategoryDto) {
    const category = await this.findOne(id); // throws if not found
    Object.assign(category, dto);
    return this.repo.save(category);
  }

  // DELETE
  async remove(id: number) {
    const category = await this.findOne(id);
    return this.repo.remove(category);
  }

  async adminCountCategories() {
    return this.repo.count();
  }

  async adminFindAllCategories() {
    return this.repo.find();
  }
}
