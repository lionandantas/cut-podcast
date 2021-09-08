import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as ytdl from 'ytdl-core';
import * as fs from 'fs';
import { AppService } from 'src/app.service';
import Utility from '../utility';
let taskRunning = false;

@Injectable()
export class DownloadVideoService {
  private readonly logger = new Logger(DownloadVideoService.name);

  constructor(private service: AppService) {}

  @Cron('*/1 * * * *')
  async handleCron() {
    this.logger.debug('VERIFICANDO SE POSSUI VIDEO PARA BAIXAR');
    try {
      if (taskRunning) {
        console.log('JÁ POSSUI UM VIDEO SENDO BAIXADO');
        return;
      }
      const video = await this.service.findOne();

      if (video) {
        this.logger.debug('EXISTE VIDEO PARA BAIXAR');

        video.initiated = true;

        await this.service.save(video);
        const localVideo = Utility.getLocalVideoDownloaded(video.title);
        console.log(`LOCAL DO VIDEO ${localVideo}`);
        ytdl(video.url)
          .pipe(fs.createWriteStream(localVideo))
          .on('finish', async () => {
            this.logger.debug('DOWNLOAD COMPLETO');
            video.downloaded = true;
            await this.service.save(video);
            taskRunning = false;
          })
          .on('ready', () => {
            this.logger.debug(`ready`);
          })
          .on('error', (error) => {
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
  }
}
