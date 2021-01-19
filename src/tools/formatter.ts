import * as FS from "fs";
import * as Prettier from "prettier";
import { Project } from "./project";

/**
 * Formats the project's source code in the Prettier style.
 */
export class Formatter {
  private readonly project: Project;

  public constructor(project: Project) {
    this.project = project;
  }

  /**
   * Formats the project's source code in the Prettier style.
   */
  public async format(): Promise<void> {
    for await (const [path, isDir] of this.project.walk(
      this.project.paths.source
    )) {
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
