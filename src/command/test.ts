import * as Jest from "jest";
import { Config as JestConfig } from "@jest/types";

import { ProjectPaths } from "@project/paths";
import { Project } from "@project/project";
import { Action } from "@project/ui";

const JEST_FLAG_REGEX: RegExp = /--?([^=]+)(?:=(.*))?/;

export const TestAction: Action<{}> = {
  type: "action",
  name: "test",
  description:
    "Run unit tests against the project using the Jest testing framework. Jest CLI options can be passed " +
    "after batterypack options to modify Jest's behavior for a single run.",
  usage: "[options] [jest options]",
  flags: {},
  run: async (project: Project, flags, passthroughArgs) => {
    // build a list of project roots to test on
    const roots = [];
    for await (const subproject of project.walk()) {
      roots.push(await subproject.resolver.resolve(ProjectPaths.root));
    }

    // build object with cli options
    const cliArgs: string[] = [];
    const cliOptions: Omit<JestConfig.Argv, "_" | "$0"> = {};
    for (const passthroughArg of passthroughArgs) {
      // check if passthrough value looks like an option
      const optMatch: RegExpMatchArray | null =
        passthroughArg.match(JEST_FLAG_REGEX);
      if (optMatch === null) {
        // passthrough value doesn't look like an option, assume it's an arg
        cliArgs.push(passthroughArg);
        continue;
      }

      // extract flag name and value
      // if no value is specified, assume true
      const flagName: string = optMatch[1];
      cliOptions[flagName] = [undefined, "true"].includes(optMatch[2])
        ? true
        : optMatch[2] === "false"
        ? false
        : optMatch[2];
    }

    /*
      The Jest team is working on a programmatic API as part of their
      TypeScript conversion project, but for now this is the only
      supported way of running Jest programmatically.
    */
    const { results } = await Jest.runCLI(
      {
        _: cliArgs,
        $0: "batterypack",
        passWithNoTests: true,
        ...(project.config.overrides?.jest ?? {}),
        ...cliOptions,
      },
      roots
    );
    if (!results.success) {
      process.exit(1);
    }
  },
};
