import { Subcommand, SubcommandOpts } from "./index";
import { CompilationUnit, Compiler, CompilerErrorSet } from "../tools/compiler";
import { withUiContext } from "../ui";
import Chalk from "chalk";

export class BuildSubcommand extends Subcommand {
  public async run(opts: SubcommandOpts): Promise<void> {
    const compiler = new Compiler(opts.project);

    const unit: CompilationUnit = await withUiContext(
      "Preparing compilation unit",
      async () => {
        return compiler.prepare();
      }
    );

    await withUiContext(
      "Compiling project",
      async () => {
        unit.build();
      },
      (err: Error) => {
        if (err instanceof CompilerErrorSet) {
          // build error messages from set
          const errorMessages: string[] = [];
          for (const error of err.errors) {
            let errorMessage: string[] = [`[${error.diagnosticCode}]`];
            if (error.location !== undefined) {
              errorMessage.push(`${Chalk.cyan.underline(error.location)}`);
            }
            errorMessage.push(error.messageText);
            errorMessages.push(errorMessage.join(" "));
          }
          return errorMessages.join("\n");
        }
        return undefined;
      }
    );
  }
}
