import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ToolCategory {
  @PrimaryGeneratedColumn()
  category_id: number;

  @Column({ unique: true })
  category_name: string;

  @Column({ nullable: true })
  description: string;
}
