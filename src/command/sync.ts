import FS from "fs";
import { Listr, ListrTask } from "listr2";
import Path from "path";

import {
  Derivation,
  DockerIgnoreDerivation,
  GitIgnoreDerivation,
  JestDerivation,
  PackageDerivation,
  PrettierDerivation,
  TypeScriptDerivation,
  YarnDerivation,
  YarnDummyCompatDerivation,
} from "@project/derivation";
import { ProjectPaths } from "@project/paths";
import { Action } from "@project/ui";

// build a list of derivations
const DERIVATIONS: Derivation[] = [
  new PackageDerivation(),
  new JestDerivation(),
  new PrettierDerivation(),
  new TypeScriptDerivation(),
  new YarnDerivation(),
  new YarnDummyCompatDerivation(),
];
DERIVATIONS.push(
  new DockerIgnoreDerivation(DERIVATIONS),
  new GitIgnoreDerivation(DERIVATIONS)
);

export const SyncAction: Action<{}> = {
  type: "action",
  name: "sync",
  description: "sync project configuration files",
  flags: {},
  run: async (project): Promise<void> => {
    // build the task list
    const tasks: ListrTask[] = [];
    for await (const subproject of project.walk()) {
      tasks.push({
        title: await subproject.resolver.resolve(ProjectPaths.root),
        task: async () => {
          // flush persistence files
          await subproject.flush();

          // make derivations
          for (const derivation of DERIVATIONS) {
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

    // run the task list
    await new Listr(tasks, {
      concurrent: true,
    }).run();
  },
};
