import * as FS from "fs";
import * as JsonSchema from "jsonschema";
import * as Path from "path";

import { PathResolver, ProjectPaths } from "@project/paths";
import { LoadedStore, YamlStore } from "@project/persistence/store";
import {
  ConfigMissingError,
  ConfigSchemaError,
  ConfigVersionMismatchError,
} from "@project/errors";
import { META } from "@project/meta";

/**
 * Path to the JSON schema file.
 */
const SCHEMA_PATH: string = Path.join(
  __dirname,
  "..",
  "..",
  "docs",
  "schemas",
  "batterypack-0.4.0.schema.json"
);

/**
 * Project persistence representation. batterypack uses this persistence to
 * build derivations for tool-specific configuration files.
 */
export interface Config {
  /**
   * Batterypack options
   */
  batterypack: {
    /**
     * Required batterypack version.
     */
    version: string;
  };
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
  name: string;

  /**
   * Override component configuration options. This may break your toolchain!
   */
  overrides: {
    /**
     * TypeScript compiler option overrides.
     */
    typescript: {
      [key: string]: string;
    };
  };

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
    // load config file
    const configPath: string = await resolver.resolve(
      ProjectPaths.files.config
    );
    let config: Config | undefined = await super.readData<Config>(configPath);
    if (config === undefined) {
      throw new ConfigMissingError(configPath);
    }

    // load schema file
    const schema = JSON.parse(
      (await FS.promises.readFile(SCHEMA_PATH)).toString("utf-8")
    );

    // validate config file schema
    const validator = new JsonSchema.Validator();
    try {
      validator.validate(config, schema, {
        throwError: true,
      });
    } catch (e) {
      if (e instanceof JsonSchema.ValidationError) {
        throw new ConfigSchemaError(configPath, e);
      }
    }

    // verify version number matches
    if (config.batterypack.version !== META.version) {
      throw new ConfigVersionMismatchError(
        configPath,
        config.batterypack.version
      );
    }

    // bind data to instance
    return super.bindDynamicAccessors<ConfigFile, Config>(
      new ConfigFile(config, configPath)
    );
  }
}
