import { Buffer } from "buffer";

import { Project } from "@project/project";

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
   * @param project Current project
   */
  makeDerivation(project: Project): Promise<Buffer>;
}
