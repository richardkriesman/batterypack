import { Listr, ListrTask } from "listr2";
import * as Path from "path";

import { Compiler } from "@project/compiler";
import { Formatter } from "@project/formatter";
import { Inspector } from "@project/inspector";
import { File } from "@project/io";
import { ProjectPaths } from "@project/paths";
import { Action } from "@project/ui";

export const BuildAction: Action<{
  assertFormat: boolean;
}> = {
  type: "action",
  name: "build",
  description: "compile project source code",
  flags: {
    assertFormat: {
      type: "switch",
      description:
        "don't build unless the source code matches Prettier's style",
    },
  },
  run: async (project, flags): Promise<void> => {
    // determine root path of top-level project
    const rootPath: string = await project.resolver.resolve(ProjectPaths.root);

    // build tasks to compile each subproject
    const tasks: ListrTask[] = [];
    for await (const subproject of project.walk()) {
      // determine subproject root path relative to the top-level project
      const relPath: string = Path.relative(
        rootPath,
        await subproject.resolver.resolve(ProjectPaths.root)
      );

      // build subtasks for the subproject
      const title: string =
        relPath.length > 0 ? `Building ${relPath}` : "Building";
      tasks.push({
        title,
        skip: async () => {
          // skip if the source entrypoint doesn't exist
          if (
            !(await new File(
              await subproject.getSourceEntrypoint()
            ).doesExist())
          ) {
            return `${title}: No source entrypoint`;
          }

          // skip if the fingerprint of the source directory matches
          if (
            subproject.internal.sourceFingerprint ===
            (await subproject.getSourceFingerprint())
          ) {
            return `${title}: Up-to-date`;
          }

          // don't skip, subproject needs to be built
          return false;
        },
        task: (ctx, task) =>
          task.newListr([
            {
              title: "Formatting",
              task: () => {
                const formatter = new Formatter(subproject.resolver);
                if (flags.assertFormat) {
                  return formatter.assert();
                } else {
                  return formatter.format();
                }
              },
            },
            {
              title: "Inspecting",
              task: () =>
                new Inspector(subproject).assertNoCircularDependencies(),
            },
            {
              title: "Compiling",
              task: async () => {
                // compile subproject source
                await new Compiler(subproject).compile();

                // update subproject fingerprint
                subproject.internal.sourceFingerprint =
                  await subproject.getSourceFingerprint();
                await subproject.internal.flush();
              },
            },
          ]),
      });
    }

    // run tasks
    await new Listr(tasks, {
      rendererOptions: {
        showErrorMessage: false,
        showTimer: true,
      },
    }).run();
  },
};
