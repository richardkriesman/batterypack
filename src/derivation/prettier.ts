import { Derivation } from "@project/derivation";
import { Project } from "@project/project";

/**
 * Builds a .prettierrc.json file. This isn't currently used for configuration,
 * but rather to inform editors that Prettier is being used.
 */
export class PrettierDerivation implements Derivation {
  filePath: string = ".prettierrc.json";

  public async makeDerivation(project: Project): Promise<Buffer> {
    return Buffer.from(JSON.stringify({}, null, 2));
  }
}
