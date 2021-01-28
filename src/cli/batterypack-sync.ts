import "source-map-support/register";
import { asSubcommand, withUiContext } from "../ui";
import {
  Derivation,
  DerivationBuilder,
  GitIgnoreDerivation,
  TypeScriptDerivation,
  YarnDerivation,
} from "../persistence";
import { ProjectPaths } from "../paths";

asSubcommand(async (project) => {
  // build list of derivations
  const derivations: Derivation[] = [
    new TypeScriptDerivation(),
    new YarnDerivation(),
  ];
  derivations.push(new GitIgnoreDerivation(derivations));

  // build derivations for each subproject
  for await (const subproject of project.walk()) {
    const path: string = await subproject.resolver.resolve(ProjectPaths.root);
    await withUiContext(`Building derivations for ${path}`, async () => {
      // flush persistence files
      await subproject.flush();

      // make derivations
      await new DerivationBuilder(subproject).makeDerivations(derivations);
    });
  }
});
