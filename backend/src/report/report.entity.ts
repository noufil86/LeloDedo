import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Message } from '../message/message.entity';

export enum ReportStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  IGNORED = 'IGNORED',
}

export enum ReportType {
  USER = 'USER',
  MESSAGE = 'MESSAGE',
}

@Entity('reports')
@Unique(['reported_user_id', 'message_id', 'reporter_id']) // Prevent duplicate reports
export class Report {
  @PrimaryGeneratedColumn()
  report_id: number;

  @Column({ type: 'enum', enum: ReportType })
  report_type: ReportType;

  @Column({ nullable: true })
  reported_user_id: number;

  @Column({ nullable: true })
  message_id: number;

  @Column()
  reporter_id: number;

  @Column({ type: 'varchar', length: 100 })
  reason: string; // e.g., "HARASSMENT", "INAPPROPRIATE", "FRAUD", "SPAM"

  @Column({ type: 'text', nullable: true })
  description: string; // Detailed description of the report

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ type: 'text', nullable: true })
  admin_notes: string; // Admin's notes when resolving

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, { eager: true })
  reported_user: User;

  @ManyToOne(() => Message, { nullable: true, eager: true })
  message: Message;

  @ManyToOne(() => User, { eager: true })
  reporter: User;
}
