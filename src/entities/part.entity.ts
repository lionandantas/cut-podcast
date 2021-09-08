import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Video from './video.entity';

@Entity('parts')
export default class Part {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'description' })
  description: string;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'tags' })
  tags: string;

  @Column({ name: 'path', default: null, type: 'text' })
  path: string;

  @Column({ name: 'file', default: null })
  file: string;

  @Column({ name: 'start_time' })
  startTime: string;

  @Column({ name: 'end_time' })
  endTime: string;
  default: false;
  @Column({ name: 'sliced', default: false })
  sliced: boolean;

  @Column({ name: 'uploaded', default: false })
  uploaded: boolean;

  @Column({ name: 'has_thumbnail', default: false })
  hasThumbnail: boolean;

  @Column({ name: 'has_description', default: false })
  hasDescription: boolean;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Video, (video) => video.parts)
  @JoinColumn({ name: 'id_video' })
  video: Video;

  @Column({ name: 'id_video' })
  videoId: number;
}
