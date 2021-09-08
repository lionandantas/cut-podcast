import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DownloadVideoService } from './download-video/download-video.service';
import Part from './entities/part.entity';
import Video from './entities/video.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SliceVideoService } from './slice-video/slice-video.service';
import { CreateThumbnailService } from './create-thumbnail/create-thumbnail.service';
import { GenerateDescriptionService } from './generate-description/generate-description.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'temp'),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forFeature([Video, Part]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, DownloadVideoService, SliceVideoService, CreateThumbnailService, GenerateDescriptionService],
})
export class AppModule {}
