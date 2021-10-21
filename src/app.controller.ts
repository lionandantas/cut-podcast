import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { AppService } from './app.service';
import * as Yup from 'yup';
import VideoDTO from './dtos/video.dto';
import * as ffmpegPath from '@ffmpeg-installer/ffmpeg';
import * as ffmpeg from 'fluent-ffmpeg';
import { SliceVideoService } from './slice-video/slice-video.service';
import Utility from './utility';
import { YouTubeVideo } from './utility/video';
ffmpeg.setFfmpegPath(ffmpegPath.path);

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly slice: SliceVideoService,
  ) {}

  @Get()
  async getHello(): Promise<any> {
    console.log('PASSO 1');
    const name = 'video_lionan_teste';

    const nomeVideo = Utility.getLocalVideoDownloadedMP3(name);

    const teste = new YouTubeVideo(
      'https://www.youtube.com/watch?v=r4zEZrOtIXI',
    );
    console.log(`NOME VIDEO -> ${nomeVideo}`);
    teste.save(true, nomeVideo);
    return true;
  }

  @Post()
  async create(@Body() record: VideoDTO) {
    const schema = Yup.object().shape({
      name: Yup.string().required('O nome é obrigatório.'),
      url: Yup.string().required('A url é obrigatória.'),
      description: Yup.string().required('A descric é obrigatória.').min(6),
      title: Yup.string().required('O titilo é obrigatória.'),
    });

    if (!(await schema.isValid(record))) {
      await schema.validate(record).catch((error) => {
        throw Error(error.errors[0]);
      });
    }
    return this.appService.create(record);
  }
}
