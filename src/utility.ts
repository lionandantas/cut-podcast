import { join, resolve } from 'path';
import * as fs from 'fs';

export default class Utility {
  public static removeCharacters(name: string): string {
    return name
      .trim()
      .trimEnd()
      .trimStart()
      .split(' ')
      .join('')
      .toString()
      .toLowerCase()
      .replace('', '')
      .replace(/\s+/g, '');
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
    const file = `${name.toLowerCase().replace(/\s+/g, '-')}.mp4`;

    return file;
  }
  public static getNameThumbnail(name: string): string {
    const file = `${name.toLowerCase().replace(/\s+/g, '-')}.jpg`;

    return file;
  }
  public static getNameDescription(name: string): string {
    const file = `${name.toLowerCase().replace(/\s+/g, '-')}.txt`;

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
}
