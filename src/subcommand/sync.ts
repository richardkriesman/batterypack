import * as Commander from "commander";
import { Subcommand } from "./index";
import { withUiContext } from "../ui";
import { Derivation, GitIgnoreDerivation, YarnDerivation } from "../state";

export class SyncSubcommand extends Subcommand {
  public async run(opts: Commander.OptionValues): Promise<void> {
    await withUiContext("Building derivations", async () => {
      // build list of derivations
      const derivations: Derivation[] = [new YarnDerivation()];
      derivations.push(new GitIgnoreDerivation(derivations));

      // make derivations
      await this.project.stateManager.makeDerivations(derivations);
    });
  }
}
