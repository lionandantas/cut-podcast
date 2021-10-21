import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as ytdl from 'ytdl-core';
import * as fs from 'fs';
import { AppService } from 'src/app.service';
import Utility from '../utility';
let taskRunning = false;

import * as cliProgress from 'cli-progress';
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
@Injectable()
export class DownloadVideoService {
  private readonly logger = new Logger(DownloadVideoService.name);

  constructor(private service: AppService) {}

  // @Cron('*/1 * * * *')
  async handleCron() {
    this.logger.debug('VERIFICANDO SE POSSUI VIDEO PARA BAIXAR');
    const result = await this.download();
    console.log(`FOI ${result}`);
  }

  async download() {
    const promise = new Promise(async (resolve, reject) => {
      try {
        if (taskRunning) {
          console.log('JÁ POSSUI UM VIDEO SENDO BAIXADO');
          return;
        }
        const video = await this.service.findOne();

        if (video) {
          this.logger.debug('EXISTE VIDEO PARA BAIXAR');

          video.initiated = true;
          let downloadStarted = false;
          await this.service.save(video);
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
              await this.service.save(video);
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
