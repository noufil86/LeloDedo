import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from '../user/user.entity';

@Entity()
@Unique(['conversation', 'user'])
export class ConversationUserRead {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  conversation: Conversation;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'timestamp', nullable: true })
  last_seen_at: Date;

  @Column({ default: false })
  is_typing: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
