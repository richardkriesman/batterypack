import "source-map-support/register";
import { asSubcommand, withUiContext } from "../ui";
import {
  Derivation,
  DerivationBuilder,
  GitIgnoreDerivation,
  TypeScriptDerivation,
  YarnDerivation,
} from "../persistence";

asSubcommand(async (project) => {
  await withUiContext("Building derivations", async () => {
    // build list of derivations
    const derivations: Derivation[] = [
      new TypeScriptDerivation(),
      new YarnDerivation(),
    ];
    derivations.push(new GitIgnoreDerivation(derivations));

    // flush persistence files
    await project.flush();

    // make derivations
    await new DerivationBuilder(project).makeDerivations(derivations);
  });
});
