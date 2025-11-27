import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Item } from '../item/item.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ default: false })
  verified_status: boolean;

  @Column({ default: false })
  email_verified: boolean; // Dummy verification flag

  @Column({ nullable: true })
  email_verified_at: Date; // Timestamp of verification

  @Column({ nullable: true })
  suspension_reason: string;

  @Column({
    type: 'enum',
    enum: ['BORROWER', 'LENDER', 'ADMIN'],
  })
  role: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, default: null })
  average_rating: number;

  @Column({ default: 0 })
  warning_count: number;

  @Column({ nullable: true })
  ban_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  ban_until: Date;

  @Column({ nullable: true })
  password_reset_token: string;

  @Column({ type: 'timestamp', nullable: true })
  password_reset_expires: Date;

  @OneToMany(() => Item, (item) => item.owner)
  items: Item[];
}
