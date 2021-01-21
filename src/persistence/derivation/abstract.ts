import { Buffer } from "buffer";
import { Config } from "../config";
import { PathResolver } from "../../path";
import { PersistenceFile } from "../file";
import { Credentials } from "../credentials";

export interface Derivation {
  /**
   * A unique string identifying the tool this derivation is building a
   * file for.
   */
  readonly toolId: string;

  /**
   * A path to the file.
   */
  readonly filePath: string;

  /**
   * Builds a {@link Buffer} containing the file's contents from the current
   * project state.
   *
   * @param config Project configuration
   * @param credentials Project credentials
   * @param resolver Project path resolver
   */
  makeDerivation(
    config: PersistenceFile<Config>,
    credentials: PersistenceFile<Credentials>,
    resolver: PathResolver
  ): Promise<Buffer>;
}
