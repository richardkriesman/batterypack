import { Buffer } from "buffer";

import { Project } from "@project/project";

export interface Derivation {
  /**
   * A path to the file relative to the project root.
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
