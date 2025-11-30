import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { User } from '../user/user.entity';
import { BorrowRequest } from '../borrow-request/borrow-request.entity';

@Entity()
@Unique(['request', 'given_by'])
export class Rating {
  @PrimaryGeneratedColumn()
  rating_id: number;

  @ManyToOne(() => BorrowRequest, { eager: true })
  request: BorrowRequest;

  @ManyToOne(() => User, { eager: true })
  given_by: User;

  @ManyToOne(() => User, { eager: true })
  given_to: User;

  @Column({ type: 'int', default: 5 })
  score: number;

  @Column({ nullable: true, type: 'text' })
  review: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
