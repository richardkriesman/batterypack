/**
 * Project path declaration. A collection of these is available under
 * {@link ProjectPaths}.
 */
export interface ProjectPath {
  /**
   * Node type
   */
  type: "directory" | "file";

  /**
   * Relative path from the project root
   */
  relPath: string;

  /**
   * Whether this path can be hoisted. By default, this option is disabled.
   *
   * When disabled, a {@link PathResolver} will create a directory path if it
   * does not exist relative to the project root.
   *
   * When enabled, a {@link PathResolver} will traverse upwards from the
   * project root, attempting to resolve the path relative to that directory.
   * Only if no path can be found will a directory path be created, which will
   * be relative to the project root.
   */
  hoist?: boolean;
}

/**
 * Project path declarations.
 */
export const ProjectPaths: {
  root: ProjectPath;
  dirs: {
    build: ProjectPath;
    derivations: ProjectPath;
    source: ProjectPath;
  };
  files: {
    defaultBuildEntrypoint: ProjectPath;
    defaultSourceEntrypoint: ProjectPath;
    buildInfo: ProjectPath;
    config: ProjectPath;
    credentials: ProjectPath;
    internalState: ProjectPath;
  };
} = {
  root: {
    type: "directory",
    relPath: "",
  },
  dirs: {
    build: {
      type: "directory",
      relPath: "build",
    },
    derivations: {
      type: "directory",
      relPath: ".batterypack",
    },
    source: {
      type: "directory",
      relPath: "src",
    },
  },
  files: {
    defaultBuildEntrypoint: {
      type: "file",
      relPath: "build/index.js",
    },
    defaultSourceEntrypoint: {
      type: "file",
      relPath: "src/index.ts",
    },
    buildInfo: {
      type: "file",
      relPath: ".batterypack/typescript/tsconfig.tsbuildinfo",
    },
    config: {
      type: "file",
      relPath: "batterypack.yml",
    },
    credentials: {
      type: "file",
      relPath: ".batterypack/credentials.yml",
      hoist: true,
    },
    internalState: {
      type: "file",
      relPath: ".batterypack/internal.yml",
    },
  },
};
