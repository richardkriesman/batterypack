import { CONFIG_SCHEMA } from "@project/meta";
import { YamlEntity, YamlModel } from "@project/yaml";

export type DependencyRelationship = string | DependencyRelationshipObject;

export interface DependencyRelationshipObject {
  /**
   * Dependency version expression
   */
  version: string;
  /**
   * Dependency relationship type
   */
  type?: "development" | "production" | "peer";
  /**
   * Optional relationship flag
   */
  optional?: boolean;
}

/**
 * Project persistence representation. batterypack uses this persistence to
 * build derivations for tool-specific configuration files.
 */
export interface Config extends YamlEntity {
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
   * Project author information
   */
  author?: {
    /**
     * Author name
     */
    name: string;
    /**
     * Author email address
     */
    email: string;
  };

  /**
   * Build options
   */
  build?: {
    /**
     * Opt-in language features.
     *
     * This section allows for gradual adoption of new but breaking
     * language features. Over time, some feature flags will be phased
     * out under the deprecation policy and become enabled by default.
     */
    features?: {
      /**
       * Whether to require the `override` keyword when a child class
       * overrides a parent property.
       *
       * @default true
       */
      requireExplicitOverride?: boolean;
    };

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
      | "ES2021"
      | "ES2022"
      | "ESNext";
  };

  /**
   * Package dependencies
   */
  dependencies?: {
    [name: string]: DependencyRelationship;
  };

  /**
   * Project description
   */
  description?: string;

  /**
   * Docker ignore rules
   */
  dockerignore?: string[];

  /**
   * Program entrypoint for both the source and compiled code relative to the
   * base directory.
   */
  entrypoint?: {
    build: string;
    source: string;
  };

  /**
   * Git ignore rules
   */
  gitignore?: string[];

  /**
   * Project license
   *
   * @default "UNLICENSED"
   */
  license?: string;

  /**
   * Name of the project.
   */
  name: string;

  /**
   * Override component configuration options. This may break your toolchain!
   */
  overrides: {
    /**
     * Jest configuration overrides.
     */
    "jest.config.js": {
      [key: string]: unknown;
    };
    /**
     * NPM package configuration overrides.
     */
    "package.json": {
      [key: string]: unknown;
    };
    /**
     * TypeScript compiler option overrides.
     */
    "tsconfig.json": {
      [key: string]: unknown;
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

  /**
   * Project version number
   *
   * @default "1.0.0"
   */
  version?: string;
}

export const ConfigFile = new YamlModel<Config>(CONFIG_SCHEMA);
