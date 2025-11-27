import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { ToolCategory } from '../tool-category/tool-category.entity';

export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'REMOVED';

@Entity()
export class Item {
  @PrimaryGeneratedColumn()
  item_id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ type: 'simple-array', nullable: true })
  image_urls: string[];

  @Column({
    type: 'enum',
    enum: ['AVAILABLE', 'UNAVAILABLE', 'REMOVED'],
    default: 'AVAILABLE',
  })
  availability_status: AvailabilityStatus;

  // RELATIONS
  @ManyToOne(() => User, (user) => user.items, { eager: true })
  owner: User;

  @ManyToOne(() => ToolCategory, { eager: true })
  category: ToolCategory;
}
