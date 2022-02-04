import * as FS from "fs";
import * as Path from "path";
import { ProjectPath } from "@project/paths/path";
import { Directory, File } from "@project/io";

/**
 * Resolves paths for a batterypack project.
 */
export class PathResolver {
  private readonly rootPath: string;

  public constructor(path: string) {
    // get absolute path to project root
    this.rootPath = Path.normalize(path);
    if (path.length > 0 && path[0] === "~") {
      // expand home alias
      this.rootPath = Path.join(process.env.HOME ?? "/", path.slice(1));
    }
    this.rootPath = Path.resolve(this.rootPath);
  }

  /**
   * Resolves a {@link ProjectPath} to an absolute string path. If the directory
   * for the path does not exist, it will be created.
   *
   * By default, the root path will be resolved.
   *
   * @param path Project path declaration
   */
  public async resolve(path?: ProjectPath): Promise<string> {
    path = path || {
      type: "directory",
      relPath: "",
    };
    let absPath: string;
    let currentRoot: string[] = this.rootPath.split(Path.sep);
    while (true) {
      // create directory if not hoisting or if current root is fs root
      if (!path.hoist || currentRoot.length === 1) {
        absPath = Path.normalize(Path.join(this.rootPath, path.relPath));
        switch (path.type) {
          case "directory":
            await FS.promises.mkdir(absPath, { recursive: true });
            break;
          case "file":
            await FS.promises.mkdir(Path.dirname(absPath), { recursive: true });
            break;
        }
        break;
      }

      // check if node exists at current root of expected type
      // yes, not doing Path.join(...currentRoot, path.relPath) is intentional
      // Path.join leaves off the leading path separator on posix systems
      absPath = Path.normalize(
        Path.join(currentRoot.join(Path.sep), path.relPath)
      );
      switch (path.type) {
        case "directory":
          if (await new Directory(absPath).doesExist()) {
            return absPath;
          }
          break;
        case "file":
          if (await new File(absPath).doesExist()) {
            return absPath;
          }
          break;
      }

      currentRoot.pop(); // go up 1 directory
    }
    return absPath;
  }

  /**
   * Recursively walks over all files and directories in a path (the project
   * root by default). Paths are absolute.
   *
   * @yields A tuple containing a path to the node and a boolean indicating
   *         whether the node is a directory.
   */
  public async *walk(basePath?: string): AsyncGenerator<[string, boolean]> {
    basePath = basePath || (await this.resolve());
    for await (const node of await FS.promises.opendir(basePath)) {
      const path: string = Path.join(basePath, node.name);
      if (node.isDirectory()) {
        yield [path, true];
        yield* this.walk(path);
      } else if (node.isFile()) {
        yield [path, false];
      }
    }
  }
}
