import { Injectable } from '@nestjs/common';
import VideoDTO from './dtos/video.dto';
import { Repository } from 'typeorm';
import Part from './entities/part.entity';
import Video from './entities/video.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    @InjectRepository(Part)
    private readonly partRepository: Repository<Part>,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }

  async create(record: VideoDTO) {
    try {
      const video = await this.videoRepository.create(record);

      const videoInserted = await this.videoRepository.save(video);

      const objects = record.parts.map(async (element) => {
        const piece = new Part();
        piece.title = element.title;
        piece.description = element.description;
        piece.name = element.title;
        piece.tags = element.tags;
        piece.sliced = false;
        piece.uploaded = false;
        piece.videoId = videoInserted.id;
        piece.startTime = element.startTime;
        piece.endTime = element.endTime;
        const pieceCreated = await this.partRepository.create(piece);
        const pieceInserted = await this.partRepository.save(pieceCreated);
        return pieceInserted;
      });
      await Promise.all(
        objects.map((x) => {
          //console.log(JSON.stringify(x));
          // x.save();
          // createdVideo createdVideo.parts.push(x);
        }),
      );
      return true;
    } catch (e) {
      console.log(`ERRO ${JSON.stringify(e)}`);
      return false;
    }
  }

  async findOne(): Promise<Video> {
    const video = await this.videoRepository.findOne({
      where: {
        initiated: false,
        downloaded: false,
      },
    });
    console.log(`${JSON.stringify(video)}`);
    return video;
  }

  async save(video: Video): Promise<Video> {
    return await this.videoRepository.save(video);
  }

  async savePart(video: Part): Promise<Part> {
    return await this.partRepository.save(video);
  }

  async findVideoToSlice(): Promise<Video | null> {
    return await this.videoRepository.findOne({
      where: {
        downloaded: true,
        initiated: true,
        sliced: false,
      },
      relations: ['parts'],
    });
  }
}
