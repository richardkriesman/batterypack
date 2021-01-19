import { Subcommand, SubcommandOpts } from "./index";
import { withUiContext } from "../ui";

export class CleanSubcommand extends Subcommand {
  public async run(opts: SubcommandOpts): Promise<void> {
    await withUiContext("Cleaning build outputs", async () => {
      await this.project.clean();
    });
  }
}
