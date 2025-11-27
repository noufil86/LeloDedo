import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

import { UserModule } from '../user/user.module';
import { ItemModule } from '../item/item.module';
import { BorrowRequestModule } from '../borrow-request/borrow-request.module';
import { ToolCategoryModule } from '../tool-category/tool-category.module';
import { Conversation } from '../message/conversation.entity';
import { Message } from '../message/message.entity';
import { BorrowRequest } from '../borrow-request/borrow-request.entity';
import { User } from '../user/user.entity';
import { Item } from '../item/item.entity';
import { Rating } from '../rating/rating.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, BorrowRequest, User, Item, Rating]),
    UserModule,
    ItemModule,
    BorrowRequestModule,
    ToolCategoryModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
