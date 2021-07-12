import * as FS from "fs";
import * as Path from "path";

import { Derivation } from "@project/derivation/abstract";
import { Project } from "@project/project";

/**
 * Builds derivation files.
 */
export class DerivationBuilder {
  private readonly project: Project;

  public constructor(project: Project) {
    this.project = project;
  }

  /**
   * Build new derivations from the current project persistence.
   */
  public async makeDerivations(derivations: Derivation[]): Promise<void> {
    for (const derivation of derivations) {
      // resolve the parent directory's path - creates the dir tree if any part doesn't exist
      const parentDirPath: string = await this.project.resolver.resolve({
        type: "directory",
        relPath: Path.dirname(derivation.filePath),
      });

      // write file to derivation store
      await FS.promises.writeFile(
        Path.join(parentDirPath, Path.basename(derivation.filePath)),
        await derivation.makeDerivation(this.project)
      );
    }
  }
}
