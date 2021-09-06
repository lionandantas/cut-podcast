import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppService } from 'src/app.service';
import * as fs from 'fs';
import { resolve, join } from 'path';
import * as ffmpegPath from '@ffmpeg-installer/ffmpeg';
import * as ffmpeg from 'fluent-ffmpeg';
import Part from 'src/entities/part.entity';
import Video from 'src/entities/video.entity';
import * as moment from 'moment';

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

  async teste() {
    try {
      const video = await this.service.findVideoToSlice();
      const item = video.parts[0];
      const time_start = new Date();
      const time_end = new Date();
      const value_start = item.startTime.split(':');
      const value_end = item.endTime.split(':');

      time_start.setHours(
        Number(value_start[0]),
        Number(value_start[1]),
        Number(value_start[2]),
        0,
      );
      time_end.setHours(
        Number(value_end[0]),
        Number(value_end[1]),
        Number(value_end[2]),
        0,
      );
      const folderNameByVideo = video.title
        .trim()
        .trimEnd()
        .trimStart()
        .split(' ')
        .join('')
        .toString()
        .toLowerCase()
        .replace('', '')
        .replace(/\s+/g, '');
      const nameVideo = `${folderNameByVideo}.mp4`;
      const dirVideo = join(
        __dirname,
        '..',
        '..',
        '..',
        `temp/${folderNameByVideo}`,
      );
      const duration = Math.round(
        Number(time_end) - Number(time_start) / 1000.0,
      );
      const res = Math.abs(Number(time_end) - Number(time_start)) / 1000;
      const seconds = res % 60;
      const file = `teste.mp4`;
      const pathVideo = `teste01`;

      const localFileVideo = resolve(
        __dirname,
        '..',
        '..',
        '..',
        'temp',
        dirVideo,
        `${dirVideo}/${nameVideo}`,
      );
      const localSlices = resolve(
        __dirname,
        '..',
        '..',
        '..',
        'temp',
        folderNameByVideo,
        'slices',
        pathVideo,
      );
      console.log(`PATH ${localSlices}`);

      if (!fs.existsSync(localSlices)) {
        fs.mkdirSync(localSlices, { recursive: true });
      }

      const sliceResult = await this.sliceVideo({
        duration: 10,
        startTime: moment(time_start).format('HH:mm:ss'),
        output: localSlices,
        file: localFileVideo,
        name: file,
        record: item,
      });
      return sliceResult;
    } catch (err) {
      console.log(`DEU ERRO ${err.message}`);
    }
  }
  @Cron('*/1 * * * *')
  async handleCron() {
    this.logger.debug('cut videos');
    if (taskRunning) {
      console.log('returning');
      return;
    }

    try {
      const video = await this.service.findVideoToSlice();
      if (video != null) {
        taskRunning = true;
        this.logger.debug('EXISTE VIDEO PARA CORTAR');
        this.logger.debug(`ESSE VIDEO POSSUI ${video.parts.length} CORTES`);
        try {
          countSlice = video.parts.length;
          const promises = video.parts.map(async (item, idx) => {
            const time_start = new Date();
            const time_end = new Date();
            const value_start = item.startTime.split(':');
            const value_end = item.endTime.split(':');

            time_start.setHours(
              Number(value_start[0]),
              Number(value_start[1]),
              Number(value_start[2]),
              0,
            );
            time_end.setHours(
              Number(value_end[0]),
              Number(value_end[1]),
              Number(value_end[2]),
              0,
            );
            const folderNameByVideo = video.title
              .trim()
              .trimEnd()
              .trimStart()
              .split(' ')
              .join('')
              .toString()
              .toLowerCase()
              .replace('', '')
              .replace(/\s+/g, '');
            const nameVideo = `${folderNameByVideo}.mp4`;
            const dirVideo = join(
              __dirname,
              '..',
              '..',
              '..',
              `temp/${folderNameByVideo}`,
            );
            const duration = Math.round(
              Number(time_end) - Number(time_start) / 1000.0,
            );
            const res = Math.abs(Number(time_end) - Number(time_start)) / 1000;
            const seconds = res % 60;
            const file = `${this.removeCharacters(item.name)
              .toLowerCase()
              .replace(/\s+/g, '-')}.mp4`;
            const pathVideo = `${this.removeCharacters(item.name)
              .toLowerCase()
              .replace(/\s+/g, '-')}`;

            const localFileVideo = resolve(
              __dirname,
              '..',
              '..',
              '..',
              'temp',
              dirVideo,
              `${dirVideo}/${nameVideo}`,
            );
            const localSlices = resolve(
              __dirname,
              '..',
              '..',
              '..',
              'temp',
              folderNameByVideo,
              'slices',
              pathVideo,
            );
            if (!fs.existsSync(localSlices)) {
              fs.mkdirSync(localSlices, { recursive: true });
            }

            const sliceResult = await this.sliceVideo({
              duration: res,
              startTime: item.startTime,
              output: localSlices,
              file: localFileVideo,
              name: file,
              record: item,
            });
            if (sliceResult.Success) {
              item.path = `${item.path}/slices/${file}`;
              item.file = file;
              item.sliced = true;
              item = await this.service.savePart(item);
              console.log(`SLICE ${countSlice} | SLICED ${countSliced}`);
              countSliced++;
            } else {
              countSliced++;
            }
          });
          await Promise.all(promises);
        } catch (err) {
          console.log(`MSG ERROR: ${err.message}`);
        } finally {
          console.log(`FINALIZOU`);
          console.log(`SLICE ${countSlice} | SLICED ${countSliced}`);
          if (countSlice == countSliced) {
            video.finished = true;
            await this.service.save(video);
            taskRunning = false;
          }
        }
      } else {
        this.logger.warn('NÃO EXISTE VIDEO PARA REALIZAR O CORTE');
      }
    } catch (err) {
      this.logger.error(`ERRO AO REALIZAR O CORTE ${err.message}`);
    }
  }

  removeCharacters = function (params) {
    return params.replace('?', '');
  };
  sliceVideo = function (params: ParametersSlice) {
    const { duration, startTime, output, file, name, record } = params;

    const link = output + '\\' + name;
    return new Promise<ResultSlice>((resolve, reject) => {
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
