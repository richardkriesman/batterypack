import * as FS from "fs";
import * as Path from "path";
import rimraf from "rimraf";

export interface ProjectPaths {
  /**
   * Absolute path to the directory containing compiled JavaScript.
   */
  readonly build: string;

  /**
   * Absolute path to the tsconfig.tsbuildinfo file, which stores data needed
   * for incremental builds.
   */
  readonly buildInfo: string;

  /**
   * Absolute path to the application entrypoint in TypeScript.
   */
  readonly entrypoint: string;

  /**
   * Absolute path to the root of the project.
   */
  readonly root: string;

  /**
   * Absolute path to the directory containing TypeScript source files.
   */
  readonly source: string;
}

/**
 * Manages a Rocket project.
 */
export class Project {
  public readonly paths: ProjectPaths;

  public constructor(path: string) {
    // get absolute path to project root
    let root: string = Path.normalize(path);
    if (path.length > 0 && path[0] === "~") {
      // expand home alias
      root = Path.join(process.env.HOME ?? "/", path.slice(1));
    }
    root = Path.resolve(root);

    // build other project-related paths
    this.paths = {
      build: Path.join(root, "build"),
      buildInfo: Path.join(root, "tsconfig.tsbuildinfo"),
      entrypoint: Path.join(root, "src", "index.ts"),
      root: root,
      source: Path.join(root, "src"),
    };
  }

  /**
   * Deletes all build outputs from the project.
   */
  public async clean(): Promise<void> {
    // delete tsconfig.tsbuildinfo
    try {
      await FS.promises.unlink(this.paths.buildInfo);
    } catch (err) {
      if (err.code !== "ENOENT") {
        // ignore if file doesn't exist
        throw err;
      }
    }

    // delete build directory
    await FS.promises.rmdir(this.paths.build, {
      recursive: true,
    });
  }

  /**
   * Recursively walks over all files and directories in a path (the directory
   * root by default).
   *
   * @yields A tuple containing a path to the node and a boolean indicating
   *         whether the node is a directory.
   */
  public async *walk(
    basePath: string = this.paths.root
  ): AsyncGenerator<[string, boolean]> {
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
