import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { ConversationUserRead } from './conversation-user-read.entity';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageGateway } from './message.gateway';
import { BorrowRequest } from '../borrow-request/borrow-request.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, ConversationUserRead, BorrowRequest, User])],
  providers: [MessageService, MessageGateway],
  controllers: [MessageController],
  exports: [MessageService, MessageGateway],
})
export class MessageModule {}
