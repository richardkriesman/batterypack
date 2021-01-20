import Chalk from "chalk";
import * as Commander from "commander";
import { Subcommand } from "./index";
import { CompilationUnit, Compiler, CompilerErrorSet } from "../tool/compiler";
import { withUiContext } from "../ui";
import { CircularDependencyError, Detective } from "../tool/detective";
import { Formatter } from "../tool/formatter";

export class BuildSubcommand extends Subcommand {
  public async run(opts: Commander.OptionValues): Promise<void> {
    const compiler = new Compiler(this.project.resolver);
    const detective = new Detective(this.project.resolver);
    const formatter = new Formatter(this.project.resolver);

    // format project source code
    await withUiContext("Formatting project", async () => {
      await formatter.format();
    });

    // check for circular dependencies
    await withUiContext(
      "Checking for circular dependencies",
      async () => {
        await detective.assertNoCircularDependencies();
      },
      (err: Error) => {
        if (err instanceof CircularDependencyError) {
          let message: string[] = ["Detected circular dependencies:"];
          for (const circle of err.circles) {
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
            message.push(lines.join("\n"));
          }
          return message.join("\n");
        }
        return undefined;
      }
    );

    // create a compilation unit for the project
    const unit: CompilationUnit = await withUiContext(
      "Preparing compilation unit",
      async () => {
        return compiler.prepare();
      }
    );

    // compile the project
    await withUiContext(
      "Compiling project",
      async () => {
        unit.build();
      },
      (err: Error) => {
        if (err instanceof CompilerErrorSet) {
          // build error messages from set
          const errorMessages: string[] = ["Compiler errors:"];
          for (const error of err.errors) {
            let errorMessage: string[] = [`  [${error.diagnosticCode}]`];
            if (error.location !== undefined) {
              errorMessage.push(`${Chalk.cyan.underline(error.location)}`);
            }
            errorMessage.push(error.messageText);
            errorMessages.push(errorMessage.join(" "));
          }
          return errorMessages.join("\n\n");
        }
        return undefined;
      }
    );
  }
}
