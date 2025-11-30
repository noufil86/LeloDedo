import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { ToolCategoryService } from './tool-category.service';
import { CreateToolCategoryDto } from './dto/create-tool-category.dto';
import { UpdateToolCategoryDto } from './dto/update-tool-category.dto';

import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('tool-category')
export class ToolCategoryController {
  constructor(private readonly toolCategoryService: ToolCategoryService) {}

  // ⭐ ADMIN ONLY — CREATE CATEGORY
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateToolCategoryDto) {
    return this.toolCategoryService.create(dto);
  }

  // ⭐ PUBLIC — GET ALL CATEGORIES
  @Get()
  findAll() {
    return this.toolCategoryService.findAll();
  }

  // ⭐ PUBLIC — GET ONE CATEGORY
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toolCategoryService.findOne(parseInt(id, 10));
  }

  // ⭐ ADMIN ONLY — UPDATE CATEGORY
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateToolCategoryDto) {
    return this.toolCategoryService.update(parseInt(id, 10), dto);
  }

  // ⭐ ADMIN ONLY — DELETE CATEGORY
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.toolCategoryService.remove(parseInt(id, 10));
  }
}
