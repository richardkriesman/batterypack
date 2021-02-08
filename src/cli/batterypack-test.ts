import "source-map-support/register";
import * as Jest from "jest";

import { asSubcommand } from "@project/ui";
import { ProjectPaths } from "@project/paths";

asSubcommand(async (project) => {
  // build a list of project roots to test on
  const roots = [];
  for await (const subproject of project.walk()) {
    roots.push(await subproject.resolver.resolve(ProjectPaths.root));
  }

  /*
    The Jest team is working on a programmatic API as part of their
    TypeScript conversion project, but for now this is the only
    supported way of running Jest programmatically.
  */
  const { results } = await Jest.runCLI(
    {
      _: [],
      $0: "batterypack",
      passWithNoTests: true,
    },
    roots
  );
  if (!results.success) {
    process.exit(1);
  }
});
