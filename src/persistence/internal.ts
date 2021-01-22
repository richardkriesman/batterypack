import { PathResolver, ProjectPaths } from "../path";
import { LoadedStore, YamlStore } from "./store";

/**
 * Internal state that is not meant to be modified by the user.
 */
export interface Internal {
  /**
   * A fingerprint generated by a {@link Project} that is used to detect
   * changes to the contents of the source directory.
   */
  sourceFingerprint?: string;

  /**
   * The seed used in the generation of source fingerprints.
   */
  sourceFingerprintSeed?: number;
}

/**
 * Reads and writes the project {@link Internal} state.
 */
export class InternalFile extends YamlStore<Internal> {
  /**
   * Opens a {@link CredentialsFile}, creating the persistence file if it does
   * not already exist.
   */
  public static async open(
    resolver: PathResolver
  ): Promise<LoadedStore<InternalFile, Internal>> {
    const path: string = await resolver.resolve(
      ProjectPaths.files.internalState
    );
    let internal: Internal | undefined = await super.readData<Internal>(path);
    if (internal === undefined) {
      internal = {};
    }
    return super.bindDynamicAccessors<InternalFile, Internal>(
      new InternalFile(internal, path)
    );
  }
}