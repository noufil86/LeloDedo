import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { ItemService } from './item.service';
import { FileUploadService } from './file-upload.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

import { AuthGuard } from '@nestjs/passport';

@Controller('item')
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  // CREATE ITEM — authenticated users only
  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() dto: CreateItemDto, @Req() req) {
    return this.itemService.create(dto, req.user.user_id);
  }

  @Get()
  findAll() {
    return this.itemService.findAll();
  }

  // SEARCH & FILTER
  @Get('search/query')
  search(
    @Query('title') title?: string,
    @Query('category_id') category_id?: number,
    @Query('availability_status') availability_status?: string,
    @Query('owner_id') owner_id?: number,
    @Query('min_rating') min_rating?: number,
  ) {
    return this.itemService.search({
      title,
      category_id: category_id ? Number(category_id) : undefined,
      availability_status,
      owner_id: owner_id ? Number(owner_id) : undefined,
      min_rating: min_rating ? Number(min_rating) : undefined,
    });
  }

  // UPLOAD IMAGE
  @Post(':id/upload-image')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id') id: number,
    @UploadedFile() file: any,
    @Req() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const imageUrl = await this.fileUploadService.uploadImage(file);
    return this.itemService.addItemImage(id, imageUrl, req.user.user_id);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.itemService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: number, @Body() dto: UpdateItemDto, @Req() req) {
    return this.itemService.update(id, dto, req.user.user_id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: number, @Req() req) {
    return this.itemService.remove(id, req.user.user_id);
  }
}
