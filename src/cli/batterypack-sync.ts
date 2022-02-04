import "source-map-support/register";

import { asSubcommandTaskTree, Task } from "@project/ui";
import {
  Derivation,
  DockerIgnoreDerivation,
  GitIgnoreDerivation,
  JestDerivation,
  PrettierDerivation,
  TypeScriptDerivation,
  YarnDerivation,
  YarnDummyCompatDerivation,
} from "@project/derivation";
import { ProjectPaths } from "@project/paths";
import Path from "path";
import FS from "fs";

asSubcommandTaskTree({
  filename: __filename,
  ctx: {},
  tasks: async (project) => {
    // build list of derivations
    const derivations: Derivation[] = [
      new JestDerivation(),
      new PrettierDerivation(),
      new TypeScriptDerivation(),
      new YarnDerivation(),
      new YarnDummyCompatDerivation(),
    ];
    derivations.push(
      new DockerIgnoreDerivation(derivations),
      new GitIgnoreDerivation(derivations)
    );

    // build derivations for each subproject
    const projectTasks: Task[] = [];
    for await (const subproject of project.walk()) {
      projectTasks.push({
        description: await subproject.resolver.resolve(ProjectPaths.root),
        fn: async () => {
          // flush persistence files
          await subproject.flush();

          // make derivations
          for (const derivation of derivations) {
            // resolve the parent directory's path - creates the dir tree if any part doesn't exist
            const parentDirPath: string = await subproject.resolver.resolve({
              type: "directory",
              relPath: Path.dirname(derivation.filePath),
            });

            // write file to derivation store
            await FS.promises.writeFile(
              Path.join(parentDirPath, Path.basename(derivation.filePath)),
              await derivation.makeDerivation(subproject)
            );
          }
        },
      });
    }
    return projectTasks;
  },
});
