import "source-map-support/register";
import { asSubcommandTaskTree, Task } from "../ui";
import {
  Derivation,
  DerivationBuilder,
  GitIgnoreDerivation,
  TypeScriptDerivation,
  YarnDerivation,
} from "../persistence";
import { ProjectPaths } from "../paths";
import { JestDerivation } from "@project/persistence/derivation/jest";
import { PrettierDerivation } from "@project/persistence/derivation/prettier";
import { DockerIgnoreDerivation } from "@project/persistence/derivation/dockerignore";

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
          await new DerivationBuilder(subproject).makeDerivations(derivations);
        },
      });
    }
    return projectTasks;
  },
});
