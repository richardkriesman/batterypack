import { PathResolver, ProjectPaths } from "../path";
import { PersistenceFile, YamlFile } from "./file";

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
export class ConfigFile extends YamlFile<Config> {
  /**
   * Opens a {@link ConfigFile}, creating the persistence file if it does not
   * already exist.
   */
  public static async open(
    resolver: PathResolver
  ): Promise<PersistenceFile<Config>> {
    const statePath: string = await resolver.resolve(ProjectPaths.files.config);
    let state: Config | undefined = await super.readFile<Config>(statePath);
    if (state === undefined) {
      state = {
        gitignore: [],
        yarn: {
          linker: "pnp",
        },
      };
    }
    return super.bindDynamicAccessors(new ConfigFile(statePath, state));
  }
}
