import * as FS from "fs";
import * as Path from "path";

import { Derivation } from "@project/derivation/abstract";
import { Project } from "@project/project";
import { doesFileExist } from "@project/io";

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
      // resolve file paths for the original file in the store and the symlink
      const storePath: string = await this.project.resolver.resolve({
        type: "file",
        relPath: Path.join(
          ".batterypack",
          derivation.toolId,
          derivation.filePath
        ),
      });
      const linkPath: string = await this.project.resolver.resolve({
        type: "file",
        relPath: derivation.filePath,
      });

      // write file to derivation store
      await FS.promises.writeFile(
        storePath,
        await derivation.makeDerivation(this.project)
      );

      // link to file in derivation store
      if (await doesFileExist(linkPath)) {
        await FS.promises.unlink(linkPath);
      }
      await FS.promises.symlink(storePath, linkPath);
    }
  }
}
