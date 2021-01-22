import * as FS from "fs";
import * as Path from "path";
import { ProjectPath } from "./path";

/**
 * Resolves paths for a Rocket project.
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
      relPath: "/",
    };
    const absPath: string = Path.normalize(
      Path.join(this.rootPath, path.relPath)
    );
    switch (path.type) {
      case "directory":
        await FS.promises.mkdir(absPath, { recursive: true });
        break;
      case "file":
        await FS.promises.mkdir(Path.dirname(absPath), { recursive: true });
        break;
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
      if (await node.isDirectory()) {
        yield [path, true];
        yield* this.walk(path);
      } else if (await node.isFile()) {
        yield [path, false];
      }
    }
  }
}
