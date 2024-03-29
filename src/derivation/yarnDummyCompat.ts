import { Derivation } from "@project/derivation/abstract";
import { Project } from "@project/project";

/**
 * Builds a dummy implementation of @yarnpkg/plugin-compat. This prevents
 * the "invalid hunk" issue when using a version of TypeScript that isn't
 * supported. Either way, the plugin is used to ensure compatibility with PnP,
 * which batterypack doesn't support yet anyway.
 */
export class YarnDummyCompatDerivation implements Derivation {
  readonly filePath: string = ".yarn/plugins/@yarnpkg/plugin-compat.cjs";

  public async makeDerivation(project: Project): Promise<Buffer> {
    return Buffer.from(
      `/*
  STOP! This file is automatically generated by batterypack.
  Changes will be overwritten!
*/
module.exports = {
  name: \`@yarnpkg/plugin-compat\`,
  factory: (require) => {
    // dummy implementation to override the built-in version of this plugin
    return {}
  },
};`,
      "utf-8"
    );
  }
}
