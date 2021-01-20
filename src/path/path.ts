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
    source: ProjectPath;
  };
  files: {
    buildInfo: ProjectPath;
    sourceEntrypoint: ProjectPath;
    state: ProjectPath;
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
    source: {
      type: "directory",
      relPath: "/src",
    },
  },
  files: {
    buildInfo: {
      type: "file",
      relPath: "/.rocket/tsconfig.tsbuildinfo",
    },
    sourceEntrypoint: {
      type: "file",
      relPath: "/src/index.ts",
    },
    state: {
      type: "file",
      relPath: "/rocket.yml",
    },
  },
};
