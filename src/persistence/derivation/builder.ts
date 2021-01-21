import * as FS from "fs";
import * as Path from "path";
import { Derivation } from "./abstract";
import { doesFileExist } from "../../helpers";
import { PersistenceFile } from "../file";
import { Config } from "../config";
import { Credentials } from "../credentials";
import { PathResolver } from "../../path";

/**
 * Builds derivation files.
 */
export class DerivationBuilder {
  private readonly config: PersistenceFile<Config>;
  private readonly credentials: PersistenceFile<Credentials>;
  private readonly resolver: PathResolver;

  public constructor(
    config: PersistenceFile<Config>,
    credentials: PersistenceFile<Credentials>,
    resolver: PathResolver
  ) {
    this.config = config;
    this.credentials = credentials;
    this.resolver = resolver;
  }

  /**
   * Build new derivations from the current project persistence.
   */
  public async makeDerivations(derivations: Derivation[]): Promise<void> {
    for (const derivation of derivations) {
      // resolve file paths for the original file in the store and the symlink
      const storePath: string = await this.resolver.resolve({
        type: "file",
        relPath: Path.join(".rocket", derivation.toolId, derivation.filePath),
      });
      const linkPath: string = await this.resolver.resolve({
        type: "file",
        relPath: derivation.filePath,
      });

      // write file to derivation store
      await FS.promises.writeFile(
        storePath,
        await derivation.makeDerivation(
          this.config,
          this.credentials,
          this.resolver
        )
      );

      // link to file in derivation store
      if (await doesFileExist(linkPath)) {
        await FS.promises.unlink(linkPath);
      }
      await FS.promises.symlink(storePath, linkPath);
    }
  }
}
