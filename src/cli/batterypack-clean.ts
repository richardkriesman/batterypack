import "source-map-support/register";
import * as FS from "fs";
import * as Path from "path";

import { asSubcommandTaskTree, Task } from "@project/ui";
import { ProjectPaths } from "@project/paths";
import { Project } from "@project/project";

asSubcommandTaskTree({
  filename: __filename,
  ctx: {},
  tasks: async (project: Project) => {
    const projectTasks: Task[] = [];
    for await (const subproject of project.walk()) {
      projectTasks.push({
        description: await subproject.resolver.resolve(ProjectPaths.root),
        fn: async () => {
          // resolve paths
          const tsBuildInfoPath = Path.join(
            await subproject.resolver.resolve(ProjectPaths.dirs.derivations),
            "typescript",
            "tsconfig.tsbuildinfo"
          );
          const sourcePath: string = await subproject.resolver.resolve(
            ProjectPaths.dirs.build
          );

          // clear fingerprint
          subproject.internal.sourceFingerprint = undefined;
          subproject.internal.sourceFingerprintSeed = undefined;
          await subproject.internal.flush();

          // delete build artifacts
          try {
            await FS.promises.rmdir(sourcePath, {
              recursive: true,
            });
            await FS.promises.rm(tsBuildInfoPath);
          } catch (err) {
            if (err.code !== "ENOENT") {
              throw err;
            }
          }
        },
      });
    }
    return projectTasks;
  },
});
