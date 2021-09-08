import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppService } from 'src/app.service';
import * as ffmpegPath from '@ffmpeg-installer/ffmpeg';
import * as ffmpeg from 'fluent-ffmpeg';
import { join } from 'path';
import Utility from '../utility';
//https://www.ffmpeg.org/download.html
ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfmpegPath(
  join(__dirname, '..', '..', '..', '/ffmpeg/bin/ffmpeg.exe'),
);
ffmpeg.setFfprobePath(
  join(__dirname, '..', '..', '..', '/ffmpeg/bin/ffprobe.exe'),
);

const taskRunning = false;
interface VideoInfo {
  size: number;
  durationInSeconds;
}
@Injectable()
export class CreateThumbnailService {
  private readonly logger = new Logger(CreateThumbnailService.name);

  constructor(private service: AppService) {
    this.logger.log('*****GERAR THUMBNAIL*****');
  }

  // @Cron('*/1 * * * *')
  async handleCron() {
    try {
      if (taskRunning) {
        this.logger.error('JÁ POSSUI UMA THUMBNAIL SENDO GERADA');
        return;
      }

      const part = await this.service.findPartToGenerateThumbnail();
      if (part != null) {
        this.logger.warn('EXISTE CORTE PARA GERAR THUMBNAIL');
        const local = Utility.getFullLocalVideoSliced(
          part.video.title,
          part.name,
        );

        this.createFragmentPreview(
          local,
          Utility.getFullLocalThumbnailSliced(part.video.title, part.name),
        );
        this.logger.warn(`NOME ${local}`);
        part.hasThumbnail = true;
        await this.service.savePart(part);
      } else {
        this.logger.log('NÃO EXISTE CORTE PARA GERAR THUMBNAIL');
      }

      //ffmpeg -i video.mp4 -y -vf fps=1/24 thumb%04d.jpg
    } catch (err) {
      this.logger.error(`ERRO AO GERAR THUMBNAIL ${err.message}`);
    }
  }

  getVideoInfo = (inputPath: string) => {
    return new Promise<VideoInfo>((resolve, reject) => {
      return ffmpeg.ffprobe(inputPath, (error, videoInfo) => {
        if (error) {
          return reject(error);
        }

        const { duration, size } = videoInfo.format;

        return resolve({
          size,
          durationInSeconds: Math.floor(duration),
        });
      });
    });
  };

  createFragmentPreview = async (
    inputPath,
    outputPath,
    fragmentDurationInSeconds = 4,
  ) => {
    return new Promise(async (resolve, reject) => {
      const { durationInSeconds: videoDurationInSeconds } =
        await this.getVideoInfo(inputPath);

      const startTimeInSeconds = this.getStartTimeInSeconds(
        videoDurationInSeconds,
        fragmentDurationInSeconds,
      );

      return ffmpeg()
        .input(inputPath)
        .inputOptions([`-ss ${startTimeInSeconds}`])
        .outputOptions([`-t ${fragmentDurationInSeconds}`])
        .noAudio()
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  };

  getStartTimeInSeconds = (
    videoDurationInSeconds,
    fragmentDurationInSeconds,
  ) => {
    // by subtracting the fragment duration we can be sure that the resulting
    // start time + fragment duration will be less than the video duration
    const safeVideoDurationInSeconds =
      videoDurationInSeconds - fragmentDurationInSeconds;

    // if the fragment duration is longer than the video duration
    if (safeVideoDurationInSeconds <= 0) {
      return 0;
    }

    return this.getRandomIntegerInRange(
      0.25 * safeVideoDurationInSeconds,
      0.75 * safeVideoDurationInSeconds,
    );
  };

  getRandomIntegerInRange = (min, max) => {
    const minInt = Math.ceil(min);
    const maxInt = Math.floor(max);

    return Math.floor(Math.random() * (maxInt - minInt + 1) + minInt);
  };

  createXFramesPreview = (inputPath, outputPattern, numberOfFrames) => {
    return new Promise(async (resolve, reject) => {
      const { durationInSeconds } = await this.getVideoInfo(inputPath);

      // 1/frameIntervalInSeconds = 1 frame each x seconds
      const frameIntervalInSeconds = Math.floor(
        durationInSeconds / numberOfFrames,
      );

      return ffmpeg()
        .input(inputPath)
        .outputOptions([`-vf fps=1/${frameIntervalInSeconds}`])
        .output(outputPattern)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  };
}
