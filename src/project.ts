import { PathResolver } from "./path";
import {
  Config,
  ConfigFile,
  Credentials,
  CredentialsFile,
  PersistenceFile,
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

  public readonly config: PersistenceFile<Config>;
  public readonly credentials: PersistenceFile<Credentials>;
  public readonly resolver: PathResolver;

  private constructor(
    resolver: PathResolver,
    config: PersistenceFile<Config>,
    credentials: PersistenceFile<Credentials>
  ) {
    this.config = config;
    this.credentials = credentials;
    this.resolver = resolver;
  }
}
