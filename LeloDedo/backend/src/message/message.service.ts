import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';

import { Message } from './message.entity';
import { Conversation } from './conversation.entity';
import { ConversationUserRead } from './conversation-user-read.entity';
import { User } from '../user/user.entity';
import { BorrowRequest } from '../borrow-request/borrow-request.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private msgRepo: Repository<Message>,

    @InjectRepository(Conversation)
    private convRepo: Repository<Conversation>,

    @InjectRepository(ConversationUserRead)
    private convUserReadRepo: Repository<ConversationUserRead>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(BorrowRequest)
    private brRepo: Repository<BorrowRequest>,
  ) {}

  // ✔ Public getter so Gateway doesn't touch repos directly
  async getConversationById(id: number) {
    return this.convRepo.findOne({
      where: { conversation_id: id },
      relations: ['borrower', 'lender', 'borrow_request'],
    });
  }

  // ✔ Ensure the conversation belongs to the user
  async validateConversationAccess(conversation_id: number, user_id: number) {
    const convo = await this.getConversationById(conversation_id);

    if (!convo) throw new NotFoundException('Conversation not found');

    if (convo.borrower.user_id !== user_id && convo.lender.user_id !== user_id) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    return convo;
  }

  // ✔ Create conversation (only if request exists)
  async createConversation(user1_id: number, user2_id: number) {
    const user1 = await this.userRepo.findOne({ where: { user_id: user1_id } });
    const user2 = await this.userRepo.findOne({ where: { user_id: user2_id } });

    if (!user1 || !user2) throw new NotFoundException('Users not found');

    const existing = await this.convRepo.findOne({
      where: [
        { borrower: { user_id: user1_id }, lender: { user_id: user2_id } },
        { borrower: { user_id: user2_id }, lender: { user_id: user1_id } },
      ],
    });

    if (existing) return existing;

    const convo = this.convRepo.create({ borrower: user1, lender: user2 });
    return this.convRepo.save(convo);
  }

  // ✔ Send message
  async sendMessage(conversation_id: number, sender_id: number, text: string) {
    const convo = await this.validateConversationAccess(
      conversation_id,
      sender_id,
    );

    const message = this.msgRepo.create({
      text,
      sender: { user_id: sender_id },
      conversation: convo,
    });

    const saved = await this.msgRepo.save(message);
    console.log('[MessageService][sendMessage] Saved message:', saved);
    return saved;
  }

  // ✔ Get chat history with security validation
  async getMessages(conversation_id: number, user_id: number, limit = 50, page = 0) {
    // Validate user has access to this conversation
    await this.validateConversationAccess(conversation_id, user_id);

    const take = Math.max(1, Math.min(500, Number(limit || 50)));
    const skip = Math.max(0, Number(page || 0)) * take;

    // Update user's last_seen_at
    await this.updateLastSeen(conversation_id, user_id);

    const messages = await this.msgRepo.find({
      where: { conversation: { conversation_id } },
      relations: ['sender'],
      order: { created_at: 'ASC' },
      take,
      skip,
    });
    console.log(`[MessageService][getMessages] Returning ${messages.length} messages for conversation ${conversation_id}`);
    return messages;
  }

  // ✔ Mark all as read
  async markAsRead(conversation_id: number, user_id: number) {
    await this.validateConversationAccess(conversation_id, user_id);
    // mark messages as read where sender is not the current user and read=false
    const unread = await this.msgRepo.find({
      where: { conversation: { conversation_id }, read: false },
      relations: ['sender'],
    });

    const toMark = unread.filter((m) => m.sender?.user_id !== user_id);
    for (const m of toMark) {
      m.read = true;
      m.read_at = new Date();
      await this.msgRepo.save(m);
    }

    return { affected: toMark.length };
  }

  // Compatibility wrappers used by controller
  async getOrCreateConversationByBorrowRequest(borrow_request_id: number) {
    // try to find existing conversation
    const existing = await this.convRepo.findOne({
      where: { borrow_request: { request_id: borrow_request_id } },
      relations: ['borrow_request', 'borrower', 'lender'],
    });

    if (existing) return existing;

    // load borrow request with borrower and lender
    const br = await this.brRepo.findOne({
      where: { request_id: borrow_request_id },
      relations: ['borrower', 'lender'],
    });
    if (!br) throw new NotFoundException('Borrow request not found');

    // create a new conversation with all required fields
    const convo = this.convRepo.create({
      borrow_request: br,
      borrower: br.borrower,
      lender: br.lender,
    });
    return this.convRepo.save(convo);
  }

  async sendMessageByBorrowRequest(borrow_request_id: number, sender_id: number, text: string) {
    const convo = await this.convRepo.findOne({ where: { borrow_request: { request_id: borrow_request_id } } });
    const c = convo ?? (await this.getOrCreateConversationByBorrowRequest(borrow_request_id));
    return this.sendMessage(c.conversation_id, sender_id, text);
  }

  async markConversationRead(conversation_id: number, user_id: number, message_ids?: number[]) {
    await this.validateConversationAccess(conversation_id, user_id);
    if (message_ids && message_ids.length) {
      const msgs = await this.msgRepo.find({
        where: { conversation: { conversation_id } },
        relations: ['sender'],
      });
      const toMark = msgs.filter((m) => message_ids.includes((m as any).message_id) && m.sender?.user_id !== user_id && !m.read);
      for (const m of toMark) {
        m.read = true;
        m.read_at = new Date();
        await this.msgRepo.save(m);
      }
      return toMark.length;
    }

    const r = await this.markAsRead(conversation_id, user_id);
    return r.affected || 0;
  }

  // ✔ Get inbox (list conversations)
  async getInbox(user_id: number) {
    return this.convRepo.find({
      where: [
        { borrower: { user_id } },
        { lender: { user_id } },
      ],
      relations: ['borrower', 'lender', 'borrow_request'],
      order: { updated_at: 'DESC' },
    });
  }

  // ✔ Update conversation's last_seen_at for user
  async updateLastSeen(conversation_id: number, user_id: number) {
    let record = await this.convUserReadRepo.findOne({
      where: { conversation: { conversation_id }, user: { user_id } },
    });

    if (!record) {
      record = this.convUserReadRepo.create({
        conversation: { conversation_id } as any,
        user: { user_id } as any,
        last_seen_at: new Date(),
      });
    } else {
      record.last_seen_at = new Date();
    }

    return this.convUserReadRepo.save(record);
  }

  // ✔ Get last_seen_at for user in conversation
  async getLastSeen(conversation_id: number, user_id: number) {
    const record = await this.convUserReadRepo.findOne({
      where: { conversation: { conversation_id }, user: { user_id } },
    });

    return record?.last_seen_at || null;
  }

  // ✔ Set typing status
  async setTypingStatus(conversation_id: number, user_id: number, isTyping: boolean) {
    let record = await this.convUserReadRepo.findOne({
      where: { conversation: { conversation_id }, user: { user_id } },
    });

    if (!record) {
      record = this.convUserReadRepo.create({
        conversation: { conversation_id } as any,
        user: { user_id } as any,
        is_typing: isTyping,
      });
    } else {
      record.is_typing = isTyping;
    }

    return this.convUserReadRepo.save(record);
  }

  // ✔ Get unread message count for user in conversation
  async getUnreadCount(conversation_id: number, user_id: number) {
    await this.validateConversationAccess(conversation_id, user_id);

    return this.msgRepo.count({
      where: {
        conversation: { conversation_id },
        read: false,
      },
      relations: ['sender'],
    });
  }
}

