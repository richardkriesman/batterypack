import FS from "fs";

/**
 * Determines whether a directory exists at the specified path.
 */
export async function doesDirExist(path: string): Promise<boolean> {
  try {
    const stat = await FS.promises.stat(path);
    return stat.isDirectory();
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

/**
 * Determines whether a file exists at the specified path.
 */
export async function doesFileExist(path: string): Promise<boolean> {
  try {
    const stat = await FS.promises.stat(path);
    return stat.isFile();
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}
