import { join, resolve } from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as readline from 'readline';
// External modules
import * as ytdl from 'ytdl-core';
import * as ffmpeg from 'ffmpeg-static';

export default class Utility {
  public static removeCharacters(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .trimEnd()
      .trimStart()
      .split(' ')
      .join('')
      .toString()
      .toLowerCase()
      .replace('', '')
      .replace(/\s+/g, '')
      .replace('|', '-');
  }

  public static getFolderVideoDownloaded(name: string): string {
    const dir = join(
      __dirname,
      '..',
      '..',
      '..',
      'temp',
      this.removeCharacters(name),
    );
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }
  public static getLocalVideoDownloaded(name: string): string {
    const nameFormated = this.removeCharacters(name);
    const local = join(
      this.getFolderVideoDownloaded(name),
      `${nameFormated}.mp4`,
    );
    return local;
  }

  public static getLocalVideoDownloadedMP3(name: string): string {
    const nameFormated = this.removeCharacters(name);
    const local = join(
      this.getFolderVideoDownloaded(name),
      `${nameFormated}.mp3`,
    );
    return local;
  }

  public static getLocalVideoSliced(name: string, nameCorte: string): string {
    const pathVideo = this.getFolderVideoDownloaded(name);
    const cortePath = this.removeCharacters(nameCorte)
      .toLowerCase()
      .replace(/\s+/g, '-');

    const path = join(pathVideo, 'slices', cortePath);
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }

    return path;
  }

  public static getNameSlice(name: string): string {
    const file = `${name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace('|', '')}.mp4`;

    return file;
  }
  public static getNameThumbnail(name: string): string {
    const file = `${name
      .toLowerCase()
      .replace('|', '')
      .replace(/\s+/g, '-')}.jpg`;

    return file;
  }
  public static getNameDescription(name: string): string {
    const file = `${name
      .toLowerCase()
      .replace('|', '')
      .replace(/\s+/g, '-')}.txt`;

    return file;
  }

  public static getFullLocalVideoSliced(
    name: string,
    nameCorte: string,
  ): string {
    const pathVideo = this.getFolderVideoDownloaded(name);
    const cortePath = this.removeCharacters(nameCorte)
      .toLowerCase()
      .replace(/\s+/g, '-');

    const path = join(
      pathVideo,
      'slices',
      cortePath,
      this.getNameSlice(nameCorte),
    );

    return path;
  }
  public static getFullLocalThumbnailSliced(
    name: string,
    nameCorte: string,
  ): string {
    const pathVideo = this.getFolderVideoDownloaded(name);
    const cortePath = this.removeCharacters(nameCorte)
      .toLowerCase()
      .replace(/\s+/g, '-');

    const path = join(
      pathVideo,
      'slices',
      cortePath,
      this.getNameThumbnail(nameCorte),
    );

    return path;
  }
  public static getFullLocalDescriptionSliced(
    name: string,
    nameCorte: string,
  ): string {
    const pathVideo = this.getFolderVideoDownloaded(name);
    const cortePath = this.removeCharacters(nameCorte)
      .toLowerCase()
      .replace(/\s+/g, '-');

    const path = join(
      pathVideo,
      'slices',
      cortePath,
      this.getNameDescription(nameCorte),
    );

    return path;
  }

  public static durationVideo(startTime: string, endTime: string): number {
    const time_start = new Date();
    const time_end = new Date();
    const value_start = startTime.split(':');
    const value_end = endTime.split(':');

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

    const duration = Math.abs(Number(time_end) - Number(time_start)) / 1000;

    return duration;
  }

  public static downloadVideo(url: string, local: string) {
    console.log('PASSO 2');
    const tracker = {
      start: Date.now(),
      audio: { downloaded: 0, total: Infinity },
      video: { downloaded: 0, total: Infinity },
      merged: { frame: 0, speed: '0x', fps: 0 },
    };

    /* ytdl(video.url, { quality: 'highestvideo' })
            .pipe(fs.createWriteStream(localVideo))
            .on('finish', async () => {*/

    // Get audio and video streams
    const audio = ytdl(url, { quality: 'highestaudio' }).on(
      'progress',
      (_, downloaded, total) => {
        tracker.audio = { downloaded, total };
      },
    );
    const video = ytdl(url, { quality: 'highestvideo' }).on(
      'progress',
      (_, downloaded, total) => {
        tracker.video = { downloaded, total };
      },
    );

    // Prepare the progress bar
    let progressbarHandle = null;
    const progressbarInterval = 1000;
    const showProgress = () => {
      readline.cursorTo(process.stdout, 0);
      const toMB = (i) => (i / 1024 / 1024).toFixed(2);

      process.stdout.write(
        `Audio  | ${(
          (tracker.audio.downloaded / tracker.audio.total) *
          100
        ).toFixed(2)}% processed `,
      );
      process.stdout.write(
        `(${toMB(tracker.audio.downloaded)}MB of ${toMB(
          tracker.audio.total,
        )}MB).${' '.repeat(10)}\n`,
      );

      process.stdout.write(
        `Video  | ${(
          (tracker.video.downloaded / tracker.video.total) *
          100
        ).toFixed(2)}% processed `,
      );
      process.stdout.write(
        `(${toMB(tracker.video.downloaded)}MB of ${toMB(
          tracker.video.total,
        )}MB).${' '.repeat(10)}\n`,
      );

      process.stdout.write(
        `Merged | processing frame ${tracker.merged.frame} `,
      );
      process.stdout.write(
        `(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(
          10,
        )}\n`,
      );

      process.stdout.write(
        `running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(
          2,
        )} Minutes.`,
      );
      readline.moveCursor(process.stdout, 0, -3);
    };

    // Start the ffmpeg child process
    const ffmpegProcess = cp.spawn(
      ffmpeg,
      [
        // Remove ffmpeg's console spamming
        '-loglevel',
        '8',
        '-hide_banner',
        // Redirect/Enable progress messages
        '-progress',
        'pipe:3',
        // Set inputs
        '-i',
        'pipe:4',
        '-i',
        'pipe:5',
        // Map audio & video from streams
        '-map',
        '0:a',
        '-map',
        '1:v',
        // Keep encoding
        '-c:v',
        'copy',
        // Define output file
        'out.mkv',
      ],
      {
        windowsHide: true,
        stdio: [
          /* Standard: stdin, stdout, stderr */
          'inherit',
          'inherit',
          'inherit',
          /* Custom: pipe:3, pipe:4, pipe:5 */
          'pipe',
          'pipe',
          'pipe',
        ],
      },
    );
    ffmpegProcess.on('close', () => {
      console.log('done');
      // Cleanup
      process.stdout.write('\n\n\n\n');
      clearInterval(progressbarHandle);
    });

    // Link streams
    // FFmpeg creates the transformer streams and we just have to insert / read data
    ffmpegProcess.stdio[3].on('data', (chunk) => {
      // Start the progress bar
      if (!progressbarHandle)
        progressbarHandle = setInterval(showProgress, progressbarInterval);
      // Parse the param=value list returned by ffmpeg
      const lines = chunk.toString().trim().split('\n');
      const args = {};
      for (const l of lines) {
        const [key, value] = l.split('=');
        args[key.trim()] = value.trim();
      }
      tracker.merged = args as any;
    });
    const videoProcess = ffmpegProcess.stdio['Readable']; //5
    audio.pipe(ffmpegProcess.stdio[4] as any);
    video.pipe(videoProcess as any);
  }
}
