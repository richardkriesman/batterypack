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
    buildEntrypoint: ProjectPath;
    buildInfo: ProjectPath;
    config: ProjectPath;
    credentials: ProjectPath;
    defaultSourceEntrypoint: ProjectPath;
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
    buildEntrypoint: {
      type: "file",
      relPath: "/build/index.js",
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
    defaultSourceEntrypoint: {
      type: "file",
      relPath: "/src/index.ts",
    },
    internalState: {
      type: "file",
      relPath: "/.rocket/internal.yml",
    },
  },
};
