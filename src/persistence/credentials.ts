import { CodeArtifact, SharedIniFileCredentials } from "aws-sdk";

import { PathResolver, ProjectPaths } from "@project/paths";
import { LoadedStore, YamlStore } from "@project/persistence/store";

/**
 * Map of user credentials. These credentials are specific to the user and must
 * not be tracked by version control.
 */
export interface Credentials {
  credentials: {
    [name: string]: Credential;
  };
}

/**
 * A user credential used for authentication to various services.
 */
export type Credential = CodeArtifactCredential; // add any other types to support

/**
 * Use an AWS client profile to authenticate to a CodeArtifact NPM registry.
 */
export interface CodeArtifactCredential {
  type: "codeartifact";
  profileName: string;
  domain: string;
  domainOwner: string;
  region: string;
}

/**
 * Reads and writes the project {@link Credentials}.
 */
export class CredentialsFile extends YamlStore<Credentials> {
  /**
   * Opens a {@link CredentialsFile}, creating the persistence file if it does
   * not already exist.
   */
  public static async open(
    resolver: PathResolver
  ): Promise<LoadedStore<CredentialsFile, Credentials>> {
    const path: string = await resolver.resolve(ProjectPaths.files.credentials);
    let credentials: Credentials | undefined =
      await super.readData<Credentials>(path);
    if (credentials === undefined) {
      credentials = {
        credentials: {},
      };
    }
    return super.bindDynamicAccessors<CredentialsFile, Credentials>(
      new CredentialsFile(credentials, path)
    );
  }

  /**
   * Fetches an authentication token which grants access to an NPM registry.
   */
  public async fetchNpmAuthToken(credential: Credential): Promise<string> {
    switch (credential.type) {
      // AWS CodeArtifact
      case "codeartifact":
        const profile = new SharedIniFileCredentials({
          profile: credential.profileName,
        });
        const client: CodeArtifact = new CodeArtifact({
          credentials: profile,
          region: credential.region,
        });
        const token = await client
          .getAuthorizationToken({
            domain: credential.domain,
            domainOwner: credential.domainOwner,
          })
          .promise();
        return token.authorizationToken!;

      // unsupported credential type
      default:
        throw new TypeError(
          `Credential of type ${credential.type} does not support ` +
            "authenticating with an NPM registry."
        );
    }
  }
}
