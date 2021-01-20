import * as FS from "fs";
import * as YAML from "js-yaml";

import { State } from "./state";
import { Derivation } from "./derivation";
import { PathResolver, ProjectPaths } from "../path";

/**
 * Reads and writes the project {@link State}.
 */
export class StateManager {
  public static async open(resolver: PathResolver): Promise<StateManager> {
    const path: string = await resolver.resolve(ProjectPaths.files.state);

    // check if state file exists
    let doesExist: boolean = false;
    try {
      await FS.promises.stat(path);
      doesExist = true;
    } catch (err) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }

    // create or load file
    if (doesExist) {
      // load file
      const file = (await FS.promises.readFile(path)).toString("utf-8");
      return new StateManager(path, resolver, YAML.load(file) as State);
    } else {
      // create file
      return new StateManager(path, resolver, {
        gitignore: [],
        yarn: {
          linker: "pnp",
        },
      });
    }
  }

  public readonly state: State;

  private readonly path: string;
  private readonly resolver: PathResolver;

  private constructor(path: string, resolver: PathResolver, state: State) {
    this.state = state;
    this.path = path;
    this.resolver = resolver;
  }

  /**
   * Build new derivations from the current project state.
   */
  public async makeDerivations(derivations: Derivation[]): Promise<void> {
    await this.flush();
    for (const derivation of derivations) {
      const filePath: string = await this.resolver.resolve({
        type: "file",
        relPath: derivation.getFilePath(),
      });
      await FS.promises.writeFile(
        filePath,
        derivation.makeDerivation(this.state, this.resolver)
      );
    }
  }

  /**
   * Flush the state to disk.
   */
  public async flush(): Promise<void> {
    await FS.promises.writeFile(this.path, YAML.dump(this.state));
  }
}
