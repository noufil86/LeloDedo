// src/borrow-request/borrow-request.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BorrowRequest } from './borrow-request.entity';
import { BorrowRequestService } from './borrow-request.service';
import { BorrowRequestController } from './borrow-request.controller';

import { User } from '../user/user.entity';
import { Item } from '../item/item.entity';

import { ItemModule } from '../item/item.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BorrowRequest, User, Item]),
    ItemModule, // gives access to ItemService
  ],
  controllers: [BorrowRequestController],
  providers: [BorrowRequestService],
  exports: [BorrowRequestService],
})
export class BorrowRequestModule {}
