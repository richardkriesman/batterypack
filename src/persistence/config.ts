import { PathResolver, ProjectPaths } from "../paths";
import { LoadedStore, YamlStore } from "./store";

/**
 * Project persistence representation. batterypack uses this persistence to
 * build derivations for tool-specific configuration files.
 */
export interface Config {
  /**
   * Program entrypoint for both the source and compiled code relative to the
   * base directory.
   */
  entrypoint?: {
    build: string;
    source: string;
  };

  /**
   * ignore rules
   */
  gitignore?: string[];

  /**
   * Name of the project.
   */
  name?: string;

  /**
   * Registries can be configured on a per-scope basis by adding them here.
   * Scope names should be added without the @ prefix.
   *
   * If authentication is needed, specify a credential name and the credentials
   * will be read from batterypack's credentials file.
   */
  scopes?: {
    [scope: string]: {
      origin: string;
      credential?: string;
    };
  };

  /**
   * A list of relative paths to directories containing subprojects. Each
   * subproject root must have a batterypack.yml file.
   */
  subprojects?: string[];
}

/**
 * Reads and writes the project {@link Config}.
 */
export class ConfigFile extends YamlStore<Config> {
  /**
   * Opens a {@link ConfigFile}, creating the persistence file if it does not
   * already exist.
   */
  public static async open(
    resolver: PathResolver
  ): Promise<LoadedStore<ConfigFile, Config>> {
    const configPath: string = await resolver.resolve(
      ProjectPaths.files.config
    );
    let config: Config | undefined = await super.readData<Config>(configPath);
    if (config === undefined) {
      config = {};
    }
    return super.bindDynamicAccessors<ConfigFile, Config>(
      new ConfigFile(config, configPath)
    );
  }
}
