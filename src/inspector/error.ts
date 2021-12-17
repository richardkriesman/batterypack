import Chalk from "chalk";
import * as OS from "os";

import { HumanReadable } from "@project/types";

/**
 * The {@link Inspector} found an issue in the project's source code.
 */
export class InspectorError extends Error {
  public constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, InspectorError.prototype);
    this.name = "InspectorError";
  }
}

/**
 * The {@link Inspector} found one or more circular dependencies in the
 * project's source code.
 */
export class CircularDependencyError
  extends InspectorError
  implements HumanReadable
{
  public readonly circles: readonly (readonly string[])[];

  public constructor(circles: string[][]) {
    super();
    Object.setPrototypeOf(this, CircularDependencyError.prototype);
    this.name = "CircularDependencyError";
    this.circles = circles;
  }

  public toHumanReadable(): string {
    return [
      "Detected circular dependencies:",
      ...this.circles.map((circle) => {
        // build full path for each file
        const paths: string[] = [];
        for (let i = 0; i < circle.length; i++) {
          let path: string = circle[i];
          if (i === 0) {
            // circle root, make it a different color
            path = Chalk.yellow.underline(path);
          }
          paths.push(path);
        }

        // build a formatted message for this circle
        let indent: number = 2; // number of spaces to indent
        const lines: string[] = paths.map((path: string) => {
          let line: string = "";
          for (let i = 0; i < indent; i++) {
            line += " ";
          }
          line += `↳ ${path}`;
          indent += 2; // increase indent by 2 for each line
          return line;
        });

        // join paths into a chain
        return lines.join(OS.EOL);
      }),
    ].join(OS.EOL);
  }
}
