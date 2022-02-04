import FS from "fs";
import Path from "path";
import { Buffer } from "buffer";

export interface FilesystemItem {
  doesExist(): Promise<boolean>;
}

/**
 * Describes a filesystem directory.
 */
export class Directory implements FilesystemItem {
  public constructor(public readonly path: string) {}

  /**
   * Determines whether the directory exists.
   */
  public async doesExist(): Promise<boolean> {
    try {
      const stat = await FS.promises.stat(this.path);
      return stat.isDirectory();
    } catch (err) {
      if (err.code === "ENOENT") {
        return false;
      }
      throw err;
    }
  }

  /**
   * Lists the contents of the directory.
   */
  public async *listContents(): AsyncGenerator<FilesystemItem> {
    const dir: FS.Dir = await FS.promises.opendir(this.path);
    try {
      for await (const entry of dir) {
        const entryPath: string = Path.join(this.path, entry.name);
        if (entry.isDirectory()) {
          yield new Directory(entryPath);
        } else if (entry.isFile()) {
          yield new File(entryPath);
        }
      }
    } catch (err) {
      await dir.close();
      throw err;
    }
  }
}

/**
 * Represents a filesystem file.
 */
export class File implements FilesystemItem {
  public constructor(public readonly path: string) {}

  /**
   * Determines whether the file exists.
   */
  public async doesExist(): Promise<boolean> {
    try {
      const stat = await FS.promises.stat(this.path);
      return stat.isFile();
    } catch (err) {
      if (err.code === "ENOENT") {
        return false;
      }
      throw err;
    }
  }

  /**
   * Reads the entire file, returning a Buffer containing its contents.
   */
  public readAll(): Promise<Buffer> {
    return FS.promises.readFile(this.path);
  }

  /**
   * Writes the entire file, replacing any data that already exists.
   */
  public writeAll(buf: Buffer): Promise<void> {
    return FS.promises.writeFile(this.path, buf);
  }
}
