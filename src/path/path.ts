/**
 * Project path declaration. A collection of these is available under
 * {@link ProjectPaths}.
 */
export interface ProjectPath {
  type: "directory" | "file";
  relPath: string;
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
    relPath: "/",
  },
  dirs: {
    build: {
      type: "directory",
      relPath: "/build",
    },
    derivations: {
      type: "directory",
      relPath: "/.rocket",
    },
    source: {
      type: "directory",
      relPath: "/src",
    },
  },
  files: {
    defaultBuildEntrypoint: {
      type: "file",
      relPath: "/build/index.js",
    },
    defaultSourceEntrypoint: {
      type: "file",
      relPath: "/src/index.ts",
    },
    buildInfo: {
      type: "file",
      relPath: "/.rocket/typescript/tsconfig.tsbuildinfo",
    },
    config: {
      type: "file",
      relPath: "/rocket.yml",
    },
    credentials: {
      type: "file",
      relPath: "/.rocket/credentials.yml",
    },
    internalState: {
      type: "file",
      relPath: "/.rocket/internal.yml",
    },
  },
};
