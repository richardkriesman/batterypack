import Chalk from "chalk";

import { DiagnosticInfo } from "@project/compiler/types";
import { HumanReadable } from "@project/types";

export class CompilerError extends Error implements HumanReadable {
  public readonly diagnostics: readonly Readonly<DiagnosticInfo>[];

  public constructor(diagnostics: DiagnosticInfo[]) {
    const message: string = diagnostics
      .map((diagnostic) => {
        const cols: string[] = [`[${Chalk.yellow(diagnostic.code)}]`];
        if (diagnostic.location) {
          cols.push(`${Chalk.underline.cyan(diagnostic.location)}\n  `);
        }
        cols.push(diagnostic.message);
        return cols.join(" ");
      })
      .join("\n");
    super(
      `${Chalk.bold.red(
        "Build failed. Compiler found the following errors"
      )}:\n\n${message}`
    );
    this.diagnostics = diagnostics;
  }

  public toHumanReadable(): string {
    return this.message;
  }
}
