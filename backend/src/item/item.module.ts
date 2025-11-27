// src/item/item.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Item } from './item.entity';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { FileUploadService } from './file-upload.service';

import { User } from '../user/user.entity';
import { ToolCategory } from '../tool-category/tool-category.entity';
import { BorrowRequest } from '../borrow-request/borrow-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item, User, ToolCategory, BorrowRequest])],
  controllers: [ItemController],
  providers: [ItemService, FileUploadService],
  exports: [ItemService, FileUploadService],
})
export class ItemModule {}
