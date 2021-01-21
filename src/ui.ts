import * as Commander from "commander";
import Ora from "ora";
import Table from "cli-table";
import { Project } from "./project";

/**
 * Configures and runs this process as a Rocket subcommand.
 *
 * @param run The subcommand function.
 * @param configure A function which configures the {@link Commander.Command}.
 */
export function asSubcommand(
  run: (project: Project, opts: Commander.OptionValues) => Promise<void>,
  configure?: (command: Commander.Command) => void
): void {
  if (configure !== undefined) {
    configure(Commander.program);
  }
  Commander.program
    .option(
      "--project <project>",
      "path to the project's root directory",
      process.cwd()
    )
    .action(async () => {
      const project: Project = await Project.open(
        Commander.program.opts().project
      );
      await run(project, Commander.program.opts());
    })
    .parse();
}

/**
 * Prints a table with dynamic column widths.
 */
export function printTable(options: {
  headers: string[];
  data: string[][];
}): void {
  // determine width of longest cell for each column
  const colWidths: number[] = [];
  for (const col of options.headers) {
    colWidths.push(0);
  }
  for (const row of [options.headers].concat(options.data)) {
    for (let i = 0; i < row.length; i++) {
      if (row[i].length > colWidths[i]) {
        colWidths[i] = row[i].length + 2; // +2 for padding on edges
      }
    }
  }

  // build table
  const table = new Table({
    head: options.headers,
    colWidths: colWidths,
  });
  table.push(...options.data);

  // print table
  console.log(table.toString());
}

/**
 * Displays a spinner which runs in the background and then awaits an operation.
 * If the operation resolves, the spinner will change to a green checkmark and
 * control is returned to the caller. Any value returned by the operation will
 * be returned to the caller. If the operation rejects, the spinner
 * will change to a red X, printing the error and terminating the process
 * with an exit code of 1.
 *
 * @param description User-friendly description of the action to display
 *                    alongside the spinner.
 * @param fn Async function which will be awaited within the context.
 * @param errFn Optionally, a function which handles a thrown error, returning
 *              a string to display to the user or `undefined`, in which case
 *              the error will be printed.
 */
export async function withUiContext<T>(
  description: string,
  fn: () => Promise<T>,
  errFn: (err: Error) => string | undefined = () => undefined
): Promise<T> {
  const startTimeMs: number = Date.now();
  const spinner: Ora.Ora = Ora({
    // オラオラオラ！
    color: "yellow",
    text: description,
  }).start();
  try {
    const result: any = await fn();
    const durationSec: number = (Date.now() - startTimeMs) / 1000;
    spinner.succeed(`${spinner.text} (${durationSec}s)`);
    return result;
  } catch (err) {
    // ゴゴゴゴ
    let output: string | undefined = errFn(err);
    if (!output) {
      output = `${err.name}: ${err.message}\n${err.stack}`;
    }
    spinner.fail(output);
    process.exit(1);
  }
}
