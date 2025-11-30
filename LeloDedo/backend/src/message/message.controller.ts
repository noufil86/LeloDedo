import {
  Controller,
  Post,
  UseGuards,
  Body,
  Req,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';

@Controller('message')
@UseGuards(AuthGuard('jwt'))
export class MessageController {
  constructor(private svc: MessageService) {}

  // REST fallback: send message by borrow_request_id
  @Post('send')
  async send(@Body() dto: CreateMessageDto, @Req() req) {
    if (!dto.borrow_request_id && !dto.conversation_id)
      throw new Error('borrow_request_id or conversation_id required');

    // if conversation id given -> find conv and extract borrow_request
    const brId = dto.borrow_request_id ?? (await this.svc.getOrCreateConversationByBorrowRequest(dto.conversation_id as any)).borrow_request.request_id;

    const msg = await this.svc.sendMessageByBorrowRequest(brId, req.user.user_id, dto.text);
    return msg;
  }

  // inbox for current user
  @Get('inbox')
  async inbox(@Req() req) {
    return this.svc.getInbox(req.user.user_id);
  }

  // get conversation ID from borrow request ID
  @Get('by-borrow-request/:borrowRequestId')
  async getConversationByBorrowRequest(
    @Param('borrowRequestId') borrowRequestId: number,
    @Req() req,
  ) {
    try {
      const convo = await this.svc.getOrCreateConversationByBorrowRequest(Number(borrowRequestId));
      // ...existing code...
      if (!convo || !convo.conversation_id) {
        throw new Error('Conversation ID not found in response');
      }
      return { conversation_id: convo.conversation_id };
    } catch (error) {
      console.error('Error in getConversationByBorrowRequest:', error);
      throw error;
    }
  }

  // history (messages) for conversation
  @Get(':conversationId/history')
  async history(
    @Param('conversationId') conversationId: number,
    @Query('limit') limit = '50',
    @Query('page') page = '0',
    @Req() req,
  ) {
    const l = parseInt(limit as string) || 50;
    const p = parseInt(page as string) || 0;
    return this.svc.getMessages(Number(conversationId), req.user.user_id, l, p);
  }

  // mark messages read (REST)
  @Post('mark-read')
  async markRead(@Body() dto: MarkReadDto, @Req() req) {
    const count = await this.svc.markConversationRead(dto.conversation_id, req.user.user_id, dto.message_ids);
    return { updated: count };
  }

  // get unread count for conversation
  @Get(':conversationId/unread-count')
  async getUnreadCount(@Param('conversationId') conversationId: number, @Req() req) {
    const count = await this.svc.getUnreadCount(Number(conversationId), req.user.user_id);
    return { unread_count: count };
  }

  // get last seen timestamp
  @Get(':conversationId/last-seen')
  async getLastSeen(@Param('conversationId') conversationId: number, @Req() req) {
    const lastSeen = await this.svc.getLastSeen(Number(conversationId), req.user.user_id);
    return { last_seen_at: lastSeen };
  }
}
