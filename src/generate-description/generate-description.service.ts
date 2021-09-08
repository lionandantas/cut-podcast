import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppService } from 'src/app.service';
import * as fs from 'fs';
import Utility from '../utility';
let taskRunning = false;

@Injectable()
export class GenerateDescriptionService {
  private readonly logger = new Logger(GenerateDescriptionService.name);

  constructor(private service: AppService) {
    this.logger.log('*****GERAR DESCRICAO*****');
  }

  @Cron('*/1 * * * *')
  async handleCron() {
    try {
      if (taskRunning) {
        this.logger.error('JÁ POSSUI UMA DESCRICAO SENDO GERADA');
        return;
      }

      const part = await this.service.findPartToGenerateDescription();
      if (part != null) {
        this.logger.warn('EXISTE CORTE PARA GERAR THUMBDESCRICAONAIL');
        const stream = fs.createWriteStream(
          Utility.getFullLocalDescriptionSliced(part.video.title, part.name),
        );
        taskRunning = true;
        stream.once('open', function (fd) {
          stream.write('************************START**********************\n');
          stream.write(`TITULO: ${part.title}\n`);
          stream.write(`DESCRICÃO: ${part.description}\n`);
          stream.write(`TAGS: ${part.tags}\n`);
          stream.write('************************END**********************\n');
          stream.end();
        });
        part.hasDescription = true;
        await this.service.savePart(part);
        taskRunning = false;
        this.logger.log('DESCRIÇÃO GERADA COM SUCESSO');
      } else {
        this.logger.log('NÃO EXISTE CORTE PARA GERAR DESCRICAO');
      }
    } catch (err) {}
  }
}
