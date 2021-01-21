import { PathResolver, ProjectPaths } from "../path";
import { LoadedStore, YamlStore } from "./store";

/**
 * Project persistence representation. Rocket uses this persistence to build derivations
 * for tool-specific configuration files.
 */
export interface Config {
  /**
   * ignore rules
   */
  gitignore: string[];

  /**
   * Registries can be configured on a per-scope basis by adding them here.
   * Scope names should be added without the @ prefix.
   *
   * If authentication is needed, specify a credential name and the credentials
   * will be read from Rocket's credentials file.
   */
  scopes?: {
    [scope: string]: {
      origin: string;
      credential?: string;
    };
  };

  /**
   * .yarnrc.yml configuration
   */
  yarn: {
    linker: "pnp" | "node-modules";
  };
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
      config = {
        gitignore: [],
        yarn: {
          linker: "pnp",
        },
      };
    }
    return super.bindDynamicAccessors<ConfigFile, Config>(
      new ConfigFile(config, configPath)
    );
  }
}
