import * as Path from "path";

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
      root: root,
      source: Path.join(root, "src"),
    };
  }
}
