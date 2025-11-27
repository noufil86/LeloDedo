import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { MessageService } from './message.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class MessageGateway {
  @WebSocketServer()
  server: Server;

  constructor(private messageService: MessageService) {}

  // ✔ Each socket joins a room based on user_id
  handleConnection(client: Socket) {
    const user_id = Number(client.handshake.query.user_id);
    if (user_id) {
      client.join(`user_${user_id}`);
      console.log(`User ${user_id} connected to socket`);
    }
  }

  handleDisconnect(client: Socket) {
    const user_id = Number(client.handshake.query.user_id);
    if (user_id) {
      console.log(`User ${user_id} disconnected from socket`);
    }
  }

  // ✔ Send message event
  @SubscribeMessage('send_message')
  async handleSend(
    @MessageBody()
    data: {
      conversation_id: number;
      sender_id: number;
      text: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const msg = await this.messageService.sendMessage(
      data.conversation_id,
      data.sender_id,
      data.text,
    );

    const convo = await this.messageService.getConversationById(
      data.conversation_id,
    );

    const receiver_id =
      convo.borrower.user_id === data.sender_id
        ? convo.lender.user_id
        : convo.borrower.user_id;

    // ✔ Emit message to sender AND receiver in real time
    this.server.to(`user_${receiver_id}`).emit('new_message', msg);
    this.server.to(`user_${data.sender_id}`).emit('message_sent', msg);

    // Clear typing status
    await this.messageService.setTypingStatus(data.conversation_id, data.sender_id, false);
    this.server.to(`user_${receiver_id}`).emit('user_stopped_typing', {
      conversation_id: data.conversation_id,
      user_id: data.sender_id,
    });

    return msg;
  }

  // ✔ Mark as read
  @SubscribeMessage('mark_read')
  async handleRead(
    @MessageBody() data: { conversation_id: number; user_id: number },
  ) {
    await this.messageService.markAsRead(data.conversation_id, data.user_id);

    this.server
      .to(`user_${data.user_id}`)
      .emit('read_receipt', { conversation_id: data.conversation_id });
  }

  // ✔ User typing indicator
  @SubscribeMessage('user_typing')
  async handleUserTyping(
    @MessageBody()
    data: {
      conversation_id: number;
      user_id: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    await this.messageService.setTypingStatus(data.conversation_id, data.user_id, true);

    const convo = await this.messageService.getConversationById(
      data.conversation_id,
    );

    const receiver_id =
      convo.borrower.user_id === data.user_id
        ? convo.lender.user_id
        : convo.borrower.user_id;

    // Broadcast typing status to receiver
    this.server.to(`user_${receiver_id}`).emit('user_typing', {
      conversation_id: data.conversation_id,
      user_id: data.user_id,
      username: 'User', // Can be enhanced with actual username
    });
  }

  // ✔ User stopped typing
  @SubscribeMessage('user_stopped_typing')
  async handleUserStoppedTyping(
    @MessageBody()
    data: {
      conversation_id: number;
      user_id: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    await this.messageService.setTypingStatus(data.conversation_id, data.user_id, false);

    const convo = await this.messageService.getConversationById(
      data.conversation_id,
    );

    const receiver_id =
      convo.borrower.user_id === data.user_id
        ? convo.lender.user_id
        : convo.borrower.user_id;

    // Broadcast stopped typing to receiver
    this.server.to(`user_${receiver_id}`).emit('user_stopped_typing', {
      conversation_id: data.conversation_id,
      user_id: data.user_id,
    });
  }

  // ✔ Join conversation room (for easier broadcasting)
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversation_id: number; user_id: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `conversation_${data.conversation_id}`;
    client.join(room);

    // Update last seen
    await this.messageService.updateLastSeen(data.conversation_id, data.user_id);

    // Notify others user is viewing
    this.server.to(room).emit('user_joined_conversation', {
      conversation_id: data.conversation_id,
      user_id: data.user_id,
      timestamp: new Date(),
    });
  }

  // ✔ Leave conversation room
  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @MessageBody() data: { conversation_id: number; user_id: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `conversation_${data.conversation_id}`;
    client.leave(room);

    // Clear typing status
    await this.messageService.setTypingStatus(data.conversation_id, data.user_id, false);

    this.server.to(room).emit('user_left_conversation', {
      conversation_id: data.conversation_id,
      user_id: data.user_id,
      timestamp: new Date(),
    });
  }
}
