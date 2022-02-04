import * as Crypto from "crypto";
import * as FS from "fs";
import * as Path from "path";
import * as XXH from "xxhashjs";

import { PathResolver, ProjectPaths } from "@project/paths";
import {
  Credentials,
  CredentialsFile,
  LoadedStore,
  Internal,
  InternalFile,
} from "@project/persistence";
import { Config, ConfigFile } from "@project/config";
import { META } from "@project/meta";
import { ConfigVersionMismatchError } from "@project/errors";

/**
 * Manage a batterypack project.
 */
export class Project {
  public static async open(path: string): Promise<Project> {
    const resolver = new PathResolver(path);

    // load config file and ensure version number matches
    const configPath: string = await resolver.resolve(
      ProjectPaths.files.config
    );
    const config: Config = await ConfigFile.open(configPath);
    if (config.batterypack.version !== META.version) {
      throw new ConfigVersionMismatchError(
        configPath,
        config.batterypack.version,
        true
      );
    }

    return new Project(
      resolver,
      config,
      await CredentialsFile.open(resolver),
      await InternalFile.open(resolver)
    );
  }

  public readonly config: Config;
  public readonly credentials: LoadedStore<CredentialsFile, Credentials>;
  public readonly internal: LoadedStore<InternalFile, Internal>;
  public readonly resolver: PathResolver;

  private constructor(
    resolver: PathResolver,
    config: Config,
    credentials: LoadedStore<CredentialsFile, Credentials>,
    internal: LoadedStore<InternalFile, Internal>
  ) {
    this.config = config;
    this.credentials = credentials;
    this.resolver = resolver;
    this.internal = internal;
  }

  /**
   * Walks through the project tree. Subprojects are yielded before parents
   * so dependencies can be dealt with first.
   */
  public async *walk(visitedPaths: string[] = []): AsyncGenerator<Project> {
    const childPaths: string[] = this.config.subprojects ?? [];
    for (const relPath of childPaths) {
      const absPath: string = await this.resolver.resolve({
        type: "directory",
        relPath: relPath,
      });
      if (visitedPaths.includes(absPath)) {
        // only visit nodes once
        continue;
      }
      visitedPaths.push(absPath);
      // noinspection BadExpressionStatementJS - yes it is, WebStorm
      yield* (await Project.open(absPath)).walk(visitedPaths);
    }
    yield this;
  }

  /**
   * Gets the currently configured source code entrypoint.
   */
  public async getBuildEntrypoint(): Promise<string> {
    return this.config.entrypoint
      ? Path.join(
          await this.resolver.resolve(ProjectPaths.root),
          this.config.entrypoint.build
        )
      : await this.resolver.resolve(ProjectPaths.files.defaultBuildEntrypoint);
  }

  /**
   * Gets the currently configured source code entrypoint.
   */
  public async getSourceEntrypoint(): Promise<string> {
    return this.config.entrypoint
      ? Path.join(
          await this.resolver.resolve(ProjectPaths.root),
          this.config.entrypoint.source
        )
      : await this.resolver.resolve(ProjectPaths.files.defaultSourceEntrypoint);
  }

  /**
   * Computes a string hash which uniquely identifies the sum of content in the
   * source directory. If the contents or locations of files in the source
   * directory change, the result of this function will also change.
   */
  public async getSourceFingerprint(): Promise<string> {
    // generate random seed if one doesn't yet exist
    if (this.internal.sourceFingerprintSeed === undefined) {
      this.internal.sourceFingerprintSeed = await new Promise<number>(
        (resolve, reject) => {
          Crypto.randomInt(2 ** 48 - 1, (err, seed) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(seed);
          });
        }
      );
      await this.internal.flush();
    }

    // initialize hash
    const hash: XXH.HashObject = XXH.h64(this.internal.sourceFingerprintSeed);

    // walk through the source files, hashing each one
    const sourceDir: string = await this.resolver.resolve(
      ProjectPaths.dirs.source
    );
    for await (const [filePath, isDir] of this.resolver.walk(sourceDir)) {
      if (isDir) {
        // skip directories
        continue;
      }

      // add file
      const file: Buffer = await FS.promises.readFile(filePath);
      hash.update(file);

      // add file path - this causes the hash to change when files are moved
      hash.update(filePath);
    }

    return hash.digest().toString(16);
  }

  public flush(): Promise<[void, void]> {
    return Promise.all([this.credentials.flush(), this.internal.flush()]);
  }
}
