import * as Commander from "commander";

import { Project } from "@project/project";
import {
  FlagFullName,
  FlagMap,
  FlagParams,
  StringFlag,
  SwitchFlag,
} from "@project/ui/flag";
import { StringUtil } from "@project/util";

export type Action<F extends FlagParams> = {
  type: "action";
  /**
   * Action name. This is what the user types into the command line to
   * run this action.
   */
  name: string;
  /**
   * Description of the action, which appears on the help page.
   */
  description: string;
  /**
   * Override the usage string, which appears on the help page.
   */
  usage?: string;
  /**
   * Optional flags to accept. The full name of each flag is available in the
   * CLI using the `--` flag prefix. The name is automatically converted to
   * `kebab-case` in the CLI, but is available in its unmodified form within an
   * action runner.
   */
  flags: FlagMap<F>;
  /**
   * Whether the action parses flags manually. This does not prevent
   * {@link flags} from being used, but it does require that any flags
   * handled by {@link flags} are passed before arguments.
   */
  manualFlagParsing?: boolean;
  /**
   * Action runner function.
   */
  run(
    project: Project,
    flags: Partial<F>,
    args: string[]
  ): Promise<number> | Promise<void> | number | void;
};

function buildCommanderConfig<F extends FlagParams>(
  action: Action<F>
): Commander.Command {
  // set name, description, and common flags
  const command = new Commander.Command(action.name)
    .description(action.description)
    .option(
      "-p, --project <project>",
      "path to the project's root directory",
      process.cwd()
    );

  // add usage if specified
  if (action.usage) {
    command.usage(action.usage);
  }

  // enable passthrough args if manual arg parsing is enabled
  if (action.manualFlagParsing) {
    command.enablePositionalOptions().allowUnknownOption().passThroughOptions();
  }

  // add custom flags
  for (const [fullName, flag] of Object.entries(action.flags) as [
    FlagFullName,
    StringFlag | SwitchFlag
  ][]) {
    const kebabCaseName: string = StringUtil.toKebabCase(fullName);

    // build flag syntax string
    let flagSyntax: string[] = [];
    if (flag.shortName) {
      flagSyntax.push(`-${flag.shortName}`);
    }
    flagSyntax.push(
      `--${kebabCaseName}${flag.type === "string" ? ` <${kebabCaseName}>` : ""}`
    );
    if (flag.required) {
      command.requiredOption(flagSyntax.join(", "), flag.description);
    } else {
      command.option(flagSyntax.join(", "), flag.description);
    }
  }

  // set action function
  command.action(async (options) => {
    await action.run(
      await Project.open(options.project),
      options,
      command.args
    );
  });

  return command;
}

export const Action = {
  buildCommanderConfig,
} as const;
