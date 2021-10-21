//import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import * as ffmpegPath from '@ffmpeg-installer/ffmpeg';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ytdl from 'ytdl-core';
import { join } from 'path';
import { File } from './file';
import { unlink } from 'fs';
import * as moment from 'moment';

ffmpeg.setFfmpegPath(ffmpegPath.path);

export class YouTubeVideo {
  private readonly _url: string;
  constructor(url: string) {
    this._url = url;
  }

  /**
   * Downloads and saves the YouTube video to the given file, optionally including video
   * @param video Whether or not to include video
   * @param path Path to save data to
   * @param fileName Optional file name. Otherwise, `path` is assumed to have it
   * @returns Promise resolving with file and rejecting with error
   */
  public save = async (video: boolean, path: string) => {
    return video ? this.saveVideo(path) : this.saveAudio(path);
  };

  private saveVideo = async (path: string) => {
    return new Promise<File>(async (resolve, reject) => {
      const audioFile = await this.saveAudio(path);
      path = audioFile.filePath.replace('.mp3', '.mp4');
      const videoStream = ytdl(this._url, {
        filter: 'videoonly',
        quality: 'highestvideo',
      })
        .on('error', (err) => reject(err))
        .on('progress', (_, current, total) => {
          const percentComplete = Math.round(100 * (current / total));
          /* updateProgressBar(
            'Video: ' + percentComplete + '%',
            '#e01400',
            percentComplete,
          );*/
          const date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
          console.log(
            `Video:${percentComplete}%  percentComplete -> ${percentComplete} - > ${date}`,
          );
        });

      ffmpeg(videoStream)
        .input(audioFile.filePath)
        .on('end', () => {
          unlink(audioFile.filePath, (err) => {
            if (err) {
              reject(err);
            }
            resolve(new File(path));
          });
        })
        .on('error', (err) => reject(err))
        .save(path);
    });
  };

  private saveAudio = async (path: string) => {
    return new Promise<File>(async (resolve, reject) => {
      const stream = ytdl(this._url, { filter: 'audioonly' })
        .on('error', (err) => reject(err))
        .on('progress', (_, current, total) => {
          const percentComplete = Math.round(100 * (current / total));
          const date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

          console.log(
            `Audio:${percentComplete}%  percentComplete -> ${percentComplete} -> ${date}`,
          );

          /*updateProgressBar(
            'Audio: ' + percentComplete + '%',
            '#e01400',
            percentComplete,
          );*/
        });

      ffmpeg(stream)
        .on('start', () => {
          console.log(`ffmpeg started: ${this._url} >> ${path}`);
        })
        .on('end', () => resolve(new File(path)))
        .on('error', (err: Error) => reject(err))
        .save(path);
    });
  };
}
