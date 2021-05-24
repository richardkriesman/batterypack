import * as FS from "fs";
import * as Prettier from "prettier";

import { PathResolver, ProjectPaths } from "@project/paths";

/**
 * Formats the project's source code in the Prettier style.
 */
export class Formatter {
  private readonly resolver: PathResolver;

  public constructor(resolver: PathResolver) {
    this.resolver = resolver;
  }

  /**
   * Formats the project's source code in the Prettier style.
   */
  public async format(): Promise<void> {
    const sourcePath: string = await this.resolver.resolve(
      ProjectPaths.dirs.source
    );
    for await (const [path, isDir] of this.resolver.walk(sourcePath)) {
      if (!(path.endsWith(".ts") || path.endsWith(".tsx")) || isDir) {
        continue;
      }
      let code: string = (await FS.promises.readFile(path)).toString("utf-8");
      code = Prettier.format(code, {
        parser: "typescript",
      });
      await FS.promises.writeFile(path, code);
    }
  }
}
