import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from '../user/user.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  message_id: number;

  @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn()
  conversation: Conversation;

  @ManyToOne(() => User, { eager: true })
  sender: User;

  @Column('text')
  text: string;

  // unread/read state for receiver(s). single reader flow — if multiple devices, mark as read for all.
  @Column({ default: false })
  read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  read_at?: Date;

  @CreateDateColumn()
  created_at: Date;
}
