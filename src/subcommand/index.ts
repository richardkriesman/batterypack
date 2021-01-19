import * as Commander from "commander";
import { Project } from "../tools/project";

export type SubcommandOpts = Omit<Commander.OptionValues, "project"> & {
  project: Project;
};

export abstract class Subcommand {
  public readonly commander: Commander.Command;

  protected project: Project;

  public constructor(commander: Commander.Command) {
    this.commander = commander;
    this.commander
      .option(
        "--project <project>",
        "Path to the project's root directory",
        process.cwd()
      )
      .action(async () => {
        const opts: SubcommandOpts | Commander.OptionValues = commander.opts();
        this.project = new Project((opts as Commander.OptionValues).project);
        await this.run(opts as SubcommandOpts);
      });
  }

  public abstract run(opts: SubcommandOpts): Promise<void>;
}
