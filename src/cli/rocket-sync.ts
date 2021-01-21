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

    // make derivations
    await new DerivationBuilder(
      project.config,
      project.credentials,
      project.resolver
    ).makeDerivations(derivations);
  });
});
