import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { BorrowRequest } from '../borrow-request/borrow-request.entity';
import { User } from '../user/user.entity';
import { Message } from './message.entity';

@Entity()
@Unique(['borrow_request'])
export class Conversation {
  @PrimaryGeneratedColumn()
  conversation_id: number;

  // one conversation per borrow request (required)
  @OneToOne(() => BorrowRequest, { onDelete: 'CASCADE' })
  @JoinColumn()
  borrow_request: BorrowRequest;

  // convenience quick access
  @ManyToOne(() => User, { eager: true })
  borrower: User;

  @ManyToOne(() => User, { eager: true })
  lender: User;

  @OneToMany(() => Message, (m) => m.conversation)
  messages: Message[];

  // last message quick fields for inbox UI
  @Column({ nullable: true })
  last_message_text?: string;

  @Column({ type: 'timestamp', nullable: true })
  last_message_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
