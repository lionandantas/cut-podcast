import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppService } from 'src/app.service';
import * as ffmpegPath from '@ffmpeg-installer/ffmpeg';
import * as ffmpeg from 'fluent-ffmpeg';
import Part from 'src/entities/part.entity';
import Utility from '../utility';

ffmpeg.setFfmpegPath(ffmpegPath.path);

let taskRunning = false;
let countSlice = 0;
let countSliced = 0;
interface ParametersSlice {
  duration: number;
  startTime: string;
  output: string;
  file: string;
  name: string;
  record: Part;
}
class ResultSlice {
  Success: boolean;
  result: Part;
  constructor(_success: boolean, _result: Part) {
    this.Success = _success;
    this.result = _result;
  }
}
@Injectable()
export class SliceVideoService {
  private readonly logger = new Logger(SliceVideoService.name);

  constructor(private service: AppService) {}

  @Cron('*/1 * * * *')
  async handleCron() {
    this.logger.debug('REALIZAR OS CORTES DOS PODCAST');
    if (taskRunning) {
      console.log('JÁ POSSUI VIDEOS SENDO CORTADOS');
      return;
    }

    try {
      const video = await this.service.findVideoToSlice();
      if (video != null) {
        taskRunning = true;
        this.logger.warn('EXISTE VIDEO PARA CORTAR');
        this.logger.warn(`ESSE VIDEO POSSUI ${video.parts.length} CORTES`);
        try {
          countSlice = video.parts.length;
          const promises = video.parts.map(async (item) => {
            const duration = Utility.durationVideo(
              item.startTime,
              item.endTime,
            );

            const pathCorte = Utility.getLocalVideoSliced(
              video.title,
              item.name,
            );
            const localVideo = Utility.getLocalVideoDownloaded(video.title);
            const nameFileSliced = Utility.getNameSlice(item.name);
            const sliceResult = await this.sliceVideo({
              duration: duration,
              startTime: item.startTime,
              output: pathCorte,
              file: localVideo,
              name: Utility.getNameSlice(item.name),
              record: item,
            });
            if (sliceResult.Success) {
              item.path = Utility.getFullLocalVideoSliced(
                video.title,
                item.name,
              );
              item.file = nameFileSliced;
              item.sliced = true;
              item = await this.service.savePart(item);
              countSliced++;
            } else {
              countSliced++;
            }
          });
          await Promise.all(promises);
        } catch (err) {
          this.logger.error(`ERRO -> ${err.message}`);
        } finally {
          this.logger.warn(`FINALIZOU`);
          this.logger.warn(`SLICE ${countSlice} | SLICED ${countSliced}`);
          if (countSlice == countSliced) {
            video.sliced = true;
            await this.service.save(video);
            this.reset();
          }
        }
      } else {
        this.logger.log('NÃO EXISTE VIDEO PARA REALIZAR O CORTE');
      }
    } catch (err) {
      this.logger.error(`ERRO AO REALIZAR O CORTE ${err.message}`);
    }
  }
  getPathVideo(): string {
    return '';
  }
  reset() {
    taskRunning = false;
    countSliced = 0;
    countSlice = 0;
  }
  removeCharacters = function (params) {
    return params.replace('?', '');
  };
  sliceVideo = function (params: ParametersSlice) {
    const { duration, startTime, output, file, name, record } = params;

    const link = output + '\\' + name;
    return new Promise<ResultSlice>((resolve) => {
      this.logger.debug(`***********INICIO*************${startTime}`);
      this.logger.debug(`***********DURACAO*************${duration}`);
      ffmpeg(file)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(link)
        .on('end', function (err) {
          if (!err) {
            console.log('conversion Done');
            resolve(new ResultSlice(true, record));
          }
        })
        .on('error', function (err) {
          resolve(new ResultSlice(false, record));
          console.log('error: ', err);
        })
        .run();
    });
  };
}
