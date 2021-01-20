import * as Commander from "commander";
import { Project } from "../project";

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
        this.project = await Project.open(commander.opts().project);
        await this.run(commander.opts());
      });
  }

  public abstract run(opts: Commander.OptionValues): Promise<void>;
}
