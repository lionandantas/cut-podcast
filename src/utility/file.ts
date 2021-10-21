import { join } from 'path';

/**
 * Represents an audio file
 */
export class File {
  get filePath(): string {
    return this._filePath;
  }
  private readonly _filePath: string;

  /**
   * Creates a new File object
   * @param savePath Either the full path to the file or its parent directory
   * @param fileName Optional filename (if it's not provided it will be assumed to be in savePath)
   */
  constructor(savePath: string, fileName?: string) {
    //console.log(`PATH -> ${join(savePath, fileName)}`);
    console.log(`savePath -> ${savePath}`);
    console.log(`fileName -> ${fileName}`);
    this._filePath = savePath;
  }

  /**
   * Opens the enclosing folder and highlights the file
   */
  public open() {
    //shell.showItemInFolder(this.filePath);
  }
}
