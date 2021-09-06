import Part from './part.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('videos')
export default class Video {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @OneToMany(() => Part, (part) => part.video)
  parts: Part[];

  @Column({ name: 'name', type: 'text' })
  name: string;

  @Column({ name: 'url', type: 'text' })
  url: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'title', type: 'text' })
  title: string;

  @Column({ name: 'downloaded', default: false })
  downloaded: boolean;

  @Column({ name: 'sliced', default: false })
  sliced: boolean;

  @Column({ name: 'initiated', default: false })
  initiated: boolean;

  @Column({ name: 'finished', default: false })
  finished: boolean;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(
    _name: string,
    _url: string,
    _description?: string,
    _title?: string,
    _downloaded?: boolean,
    _initiated?: boolean,
  ) {
    this.name = _name;
    this.url = _url;
    this.description = _description;
    this.title = _title;
    this.downloaded = _downloaded;
    this.initiated = _initiated;
  }
}
