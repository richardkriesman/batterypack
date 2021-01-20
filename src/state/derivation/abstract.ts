import { Buffer } from "buffer";
import { State } from "../state";
import { PathResolver } from "../../path";
import { DeepReadonly } from "../../immutable";

export interface Derivation {
  /**
   * Gets a path, relative to the project root, of the derivation file.
   */
  getFilePath(): string;

  /**
   * Builds a {@link Buffer} containing the file's contents from the current
   * project state.
   *
   * @param state Project state
   * @param project Project manager
   */
  makeDerivation(state: DeepReadonly<State>, project: PathResolver): Buffer;
}
