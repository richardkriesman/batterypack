import { PathResolver, ProjectPaths } from "../path";
import { PersistenceFile, YamlFile } from "./file";

/**
 * Map of user credentials. These credentials are specific to the user and must
 * not be tracked by version control.
 */
export interface Credentials {
  credentials: {
    [name: string]: AwsCredentialType;
  };
}

/**
 * Use an AWS client profile to authenticate.
 */
export interface AwsCredentialType {
  type: "aws";
  profile: string;
}

/**
 * Reads and writes the project {@link Credentials}.
 */
export class CredentialsFile extends YamlFile<Credentials> {
  /**
   * Opens a {@link CredentialsFile}, creating the persistence file if it does
   * not already exist.
   */
  public static async open(
    resolver: PathResolver
  ): Promise<PersistenceFile<Credentials>> {
    const path: string = await resolver.resolve(ProjectPaths.files.credentials);
    let credentials:
      | Credentials
      | undefined = await super.readFile<Credentials>(path);
    if (credentials === undefined) {
      credentials = {
        credentials: {},
      };
    }
    return super.bindDynamicAccessors(new CredentialsFile(path, credentials));
  }
}
