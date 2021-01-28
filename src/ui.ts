import * as Commander from "commander";
import Ora from "ora";
import Listr from "listr";
import Table from "cli-table";
import { Project } from "./project";
import { BatterypackError } from "./error";

export interface UiTask<C> {
  description: string;
  fn: (ctx: C) => Promise<readonly UiTask<C>[] | void>;
  shouldSkip?: () => Promise<string | boolean>;
  formatError?: (err: Error) => string | void;
}

/**
 * Configures and runs this process as a batterypack subcommand.
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
    .parseAsync()
    .catch((err) => {
      if (err instanceof BatterypackError && err.showMinimal) {
        console.error(`\n${err.message}`); // only show message, not stack trace
      } else {
        console.error(err);
      }
      process.exit(1);
    });
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
 *
 * @deprecated
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

/**
 * Awaits a list of {@link UiTask} instances in the order they are specified.
 * Each task is displayed with a spinner, along with a description of the
 * operation.
 *
 * If a task has a {@link UiTask#shouldSkip} function defined,
 * the task will be skipped if {@link UiTask#shouldSkip} resolves with a value
 * of `true`.
 *
 * If a task resolves, the spinner will change to a green checkmark and display
 * the total amount of time the operation took to complete. If the task rejects,
 * the spinner will change to a red X, printing the error and terminating the
 * task list.
 *
 * This function resolves when all tasks resolve, and rejects if any single
 * task rejects.
 */
export async function withUiTaskList<C>(
  ctx: C,
  tasks: readonly UiTask<C>[]
): Promise<void> {
  await taskListToListr<C>(ctx, tasks).run();
}

/**
 * Converts a list of {@link UiTask} into a {@link Listr} which can be
 * executed.
 */
function taskListToListr<C>(ctx: C, tasks: readonly UiTask<C>[]): Listr {
  return new Listr(
    tasks.map((task) => ({
      title: task.description,
      task: async (ctx, listrTask) => {
        const startTimeMs: number = Date.now();
        try {
          const result: readonly UiTask<C>[] | void = await task.fn(ctx);
          if (result === undefined) {
            const durationSec: number = (Date.now() - startTimeMs) / 1000;
            listrTask.title = `${listrTask.title} (${durationSec}s)`;
            return;
          }
          return taskListToListr<C>(ctx, result);
        } catch (err) {
          let error: Error = err;
          if (task.formatError !== undefined) {
            const message: string | void = task.formatError(error);
            if (message !== undefined) {
              // error is expected, so don't show the stack trace
              error = new BatterypackError(message, true);
            }
          }
          throw error;
        }
      },
      skip:
        /*
          task.shouldSkip is cast to any because the type definition is wrong:
          the skip function can return a Promise which resolves with a string
          indicating the reason the task was skipped. This is not reflected in
          the type definition, however.
         */
        task.shouldSkip !== undefined ? (task.shouldSkip as any) : () => false,
    }))
  );
}
