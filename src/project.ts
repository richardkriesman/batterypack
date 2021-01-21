import { PathResolver } from "./path";
import {
  Config,
  ConfigFile,
  Credentials,
  CredentialsFile,
  LoadedStore,
} from "./persistence";

/**
 * Manage a Rocket project.
 */
export class Project {
  public static async open(path: string): Promise<Project> {
    const resolver = new PathResolver(path);
    return new Project(
      resolver,
      await ConfigFile.open(resolver),
      await CredentialsFile.open(resolver)
    );
  }

  public readonly config: LoadedStore<ConfigFile, Config>;
  public readonly credentials: LoadedStore<CredentialsFile, Credentials>;
  public readonly resolver: PathResolver;

  private constructor(
    resolver: PathResolver,
    config: LoadedStore<ConfigFile, Config>,
    credentials: LoadedStore<CredentialsFile, Credentials>
  ) {
    this.config = config;
    this.credentials = credentials;
    this.resolver = resolver;
  }

  public flush(): Promise<[void, void]> {
    return Promise.all([this.config.flush(), this.credentials.flush()]);
  }
}
