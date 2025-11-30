import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { User } from '../user/user.entity';
import { Item } from '../item/item.entity';

export type BorrowStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'COMPLETED';

@Entity()
export class BorrowRequest {
  @PrimaryGeneratedColumn()
  request_id: number;

  @CreateDateColumn()
  request_date: Date;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({
    type: 'enum',
    enum: [
      'PENDING',
      'APPROVED',
      'DECLINED',
      'RETURN_REQUESTED',
      'RETURNED',
      'COMPLETED',
    ],
    default: 'PENDING',
  })
  status: BorrowStatus;

  @Column({ default: false })
  extension_requested: boolean;

  @Column({ type: 'date', nullable: true })
  extension_requested_until: Date;

  @Column({ type: 'timestamp', nullable: true })
  extension_requested_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  borrower: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  lender: User;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  item: Item;
}
