import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as ytdl from 'ytdl-core';
import * as fs from 'fs';
import { join } from 'path';
import { AppService } from 'src/app.service';
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

      if (video != null) {
        this.logger.debug('EXISTE VIDEO PARA BAIXAR');

        video.initiated = true;

        await this.service.save(video);

        const name = video.title
          .trim()
          .trimEnd()
          .trimStart()
          .split(' ')
          .join('')
          .toString()
          .toLowerCase()
          .replace('', '')
          .replace(/\s+/g, '');

        const file = `${name}.mp4`;
        const pathName = `${name}`;
        console.log(`PASTA ${join(__dirname, '..')}`);
        const dir = join(__dirname, '..', '..', '..', `temp/${pathName}`);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const local = `${dir}/${file}`;

        ytdl(video.url)
          .pipe(fs.createWriteStream(local))
          .on('finish', async () => {
            this.logger.debug('DOWNLOAD COMPLETO');
            video.downloaded = true;
            await this.service.save(video);
            taskRunning = false;
          })
          .on('ready', () => {
            console.log('ready');
          })
          .on('error', (error) => {
            this.logger.debug('ERRO AO BAIXAR O VIDEO');
          });
      } else {
        this.logger.debug('NÃO EXISTE VIDEO PARA BAIXAR');
      }
    } catch (err) {
      console.log(`ERRO AO REALIZAR UPLOAD DO VIDEO ${JSON.stringify(err)}`);
    } finally {
    }
  }
}
