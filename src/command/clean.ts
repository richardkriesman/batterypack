import * as FS from "fs";
import { Listr, ListrTask } from "listr2";
import * as Path from "path";

import { ProjectPaths } from "@project/paths";
import { Project } from "@project/project";
import { Action } from "@project/ui";

export const CleanAction: Action<{}> = {
  type: "action",
  name: "clean",
  description: "delete build artifacts",
  flags: {},
  run: async (project: Project): Promise<void> => {
    // build task list
    const tasks: ListrTask[] = [];
    for await (const subproject of project.walk()) {
      tasks.push({
        title: await subproject.resolver.resolve(ProjectPaths.root),
        task: async () => {
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
            await FS.promises.rm(sourcePath, {
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

    // run task list
    await new Listr(tasks, {
      concurrent: true,
    }).run();
  },
};
