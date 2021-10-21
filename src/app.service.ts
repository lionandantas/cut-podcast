import { Injectable, Logger } from '@nestjs/common';
import VideoDTO from './dtos/video.dto';
import { Repository } from 'typeorm';
import Part from './entities/part.entity';
import Video from './entities/video.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as ytdl from 'ytdl-core';
import * as fs from 'fs';

let taskRunning = false;

import * as cliProgress from 'cli-progress';
import Utility from './utility';

const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

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
      await this.download();
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

  async findPartToGenerateThumbnail(): Promise<Part | null> {
    return await this.partRepository.findOne({
      where: {
        sliced: true,
        hasThumbnail: false,
      },
      relations: ['video'],
    });
  }

  async findPartToGenerateDescription(): Promise<Part | null> {
    return await this.partRepository.findOne({
      where: {
        sliced: true,
        hasDescription: false,
      },
      relations: ['video'],
    });
  }

  async download() {
    const promise = new Promise(async (resolve, reject) => {
      try {
        if (taskRunning) {
          console.log('JÁ POSSUI UM VIDEO SENDO BAIXADO');
          return;
        }
        const video = await this.findOne();

        if (video) {
          this.logger.debug('EXISTE VIDEO PARA BAIXAR');

          video.initiated = true;
          let downloadStarted = false;
          await this.save(video);
          const localVideo = Utility.getLocalVideoDownloaded(video.title);
          console.log(`LOCAL DO VIDEO ${localVideo}`);
          const options = {
            quality: 'highest',
            IPv6Block: '2001:2::/48',
            // Example /48 block provided by:
            // https://www.iana.org/assignments/ipv6-unicast-address-assignments/ipv6-unicast-address-assignments.xhtml
          };
          ytdl(video.url, { quality: 'highestvideo' })
            .pipe(fs.createWriteStream(localVideo))
            .on('finish', async () => {
              this.logger.debug('DOWNLOAD COMPLETO');
              video.downloaded = true;
              await this.save(video);
              taskRunning = false;
            })
            .on('ready', () => {
              this.logger.debug(`ready`);
            })
            .on('progress', (_, totalDownloaded, total) => {
              if (!downloadStarted) {
                bar1.start(total, 0);
                downloadStarted = true;
              }

              bar1.update(totalDownloaded);
            })
            .on('end', (error) => {
              bar1.stop();
              resolve(true);
            })
            .on('error', (error) => {
              resolve(false);
              this.logger.debug(`ERRO AO BAIXAR O VIDEO ${error.message}`);
            });
        } else {
          this.logger.debug('NÃO EXISTE VIDEO PARA BAIXAR');
        }
      } catch (err) {
        console.log(`ERRO AO REALIZAR UPLOAD DO VIDEO ${JSON.stringify(err)}`);
      } finally {
        this.logger.debug('PROCESSO FINALIZADO');
      }
    });
    return promise;
  }
}
