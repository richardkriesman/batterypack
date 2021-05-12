import "source-map-support/register";
import { asSubcommandTaskTree, Task } from "../ui";
import {
  Derivation,
  DerivationBuilder,
  DockerIgnoreDerivation,
  GitIgnoreDerivation,
  JestDerivation,
  PrettierDerivation,
  TypeScriptDerivation,
  YarnDerivation,
  YarnDummyCompatDerivation,
} from "../persistence";
import { ProjectPaths } from "../paths";

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
          await new DerivationBuilder(subproject).makeDerivations(derivations);
        },
      });
    }
    return projectTasks;
  },
});
