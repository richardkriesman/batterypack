import { PathResolver, ProjectPaths } from "@project/paths";
import { LoadedStore, YamlStore } from "@project/persistence/store";

/**
 * Project persistence representation. batterypack uses this persistence to
 * build derivations for tool-specific configuration files.
 */
export interface Config {
  /**
   * Build options
   */
  build?: {
    /**
     * Target version of the ECMAScript standard to build for.
     */
    target?:
      | "ES2015"
      | "ES2016"
      | "ES2017"
      | "ES2018"
      | "ES2019"
      | "ES2020"
      | "ESNext";
  };

  /**
   * Program entrypoint for both the source and compiled code relative to the
   * base directory.
   */
  entrypoint?: {
    build: string;
    source: string;
  };

  /**
   * Docker ignore rules
   */
  dockerignore?: string[];

  /**
   * Git ignore rules
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

  /**
   * Configure how unit tests are run.
   */
  unitTest?: {
    /**
     * Configure code coverage collection and rules.
     */
    coverage?: {
      /**
       * Whether code coverage checks are enabled.
       */
      enabled?: boolean;
      /**
       * Rules which must be met for code coverage checks to pass.
       */
      rules?: {
        /**
         * Minimum percent of branch coverage.
         */
        minBranchCoverage?: number;
        /**
         * Minimum percent of function coverage.
         */
        minFunctionCoverage?: number;
        /**
         * Minimum percent of line coverage.
         */
        minLineCoverage?: number;
        /**
         * Minimum percent of statement coverage.
         */
        minStatementCoverage?: number;
      };
      /**
       * Regular expressions which match file paths to ignore. These paths
       * are relative to the project's source directory.
       */
      ignore?: string[];
    };
  };

  /**
   * Use legacy CommonJS modules instead of native ECMAScript modules.
   */
  useLegacyModules?: boolean;
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
