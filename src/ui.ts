import * as Commander from "commander";
import Listr from "listr";
import { performance as Performance } from "perf_hooks";
import Table from "cli-table";
import * as WorkerThreads from "worker_threads";

import { Project } from "@project/project";
import { DeepReadonly } from "@project/immutable";
import { TreeNode } from "@project/types";
import { BatterypackError } from "@project/errors";

export interface Task<C = {}> {
  description: string;
  fn?: (ctx: C, opts: Commander.OptionValues) => Promise<void>;
  formatError?: (err: Error) => string | void;
  shouldSkip?: () => Promise<string | boolean>;
  tasks?: readonly Task<C>[];
}

class Message {
  public readonly name: string;
  public readonly data: DeepReadonly<any> | undefined;

  public constructor(name: string, data?: DeepReadonly<any>) {
    this.name = name;
    this.data = data;
  }

  public send(): void {
    WorkerThreads.parentPort!.postMessage({
      name: this.name,
      data: this.data,
    } as Message);
  }
}

export class Observer {
  private observers: Map<string, Array<(data: any) => void>>;

  public constructor(worker: WorkerThreads.Worker) {
    this.observers = new Map();
    worker.on("message", this.onMessage.bind(this));
  }

  public on(name: string, fn: (data: any) => void): void {
    let observers: Array<(data: any) => void> | undefined =
      this.observers.get(name);
    if (observers === undefined) {
      observers = [];
      this.observers.set(name, observers);
    }
    observers.push(fn);
  }

  private onMessage(message: Message): void {
    const observers: Array<(data: any) => void> | undefined =
      this.observers.get(message.name);
    if (observers === undefined) {
      return;
    }
    for (const fn of observers) {
      fn(message.data);
    }
  }
}

export interface SubcommandOptions<C extends object> {
  filename: string;
  configure?: (command: Commander.Command) => void;
  ctx: C;
  tasks: (project: Project) => Promise<readonly Task<C>[]>;
}

export function asSubcommandTaskTree<C extends object = {}>(
  options: SubcommandOptions<C>
): void {
  if (WorkerThreads.isMainThread) {
    // foreground
    options.configure?.(Commander.program); // configure arg validation

    // record perf time for reporting
    let startMs: number = Performance.now();

    // build subcommand
    Commander.program
      .option(
        "-p, --project <project>",
        "path to the project's root directory",
        process.cwd()
      )
      .option(
        "-t, --time",
        "report the total time it takes to run this command"
      )
      .action(async () => {
        // build tasks
        const project: Project = await Project.open(
          Commander.program.opts().project
        );
        const tasks = await options.tasks(project);

        // start worker thread to run tasks
        const worker = new WorkerThreads.Worker(options.filename, {
          workerData: Commander.program.opts(),
        });

        // listen for progress messages from the worker
        const observer = new Observer(worker);
        const hooks: ObserverHooks = {};
        observer.on("shouldSkip", (result: string | boolean) => {
          // shouldSkip fires for every task
          hooks.onSkipResult!(result);
        });
        observer.on("fn", () => {
          // fn fires if the task has a function that completed
          hooks.onFnResolve!();
        });
        observer.on("error", (err: Error) => {
          // error fires if the task's function throws
          hooks.onFnError!(err);
        });

        // run tasks, waiting for them to complete and worker to exit
        await Promise.all([
          new Promise((resolve2, reject2) => {
            worker.on("error", (err) => {
              reject2(err);
            });
            worker.on("exit", (exitCode) => {
              if (exitCode === 0) {
                resolve2(undefined);
              }
            });
          }),
          makeUiListr<C>(hooks, tasks).run(),
        ]);
      })
      .parseAsync()
      .catch((err) => {
        if (err instanceof BatterypackError && err.showMinimal) {
          // TODO: prettier error messages - use chalk?
          console.error(err.message);
        } else {
          console.error(err);
        }
        process.exit(1);
      })
      .finally(() => {
        if (Commander.program.opts().time) {
          const elapsedSec: number = (Performance.now() - startMs) / 1000;
          console.log(`\n  ⏱  Command ran for ${elapsedSec.toFixed(3)}s.`);
        }
      });
  } else {
    // background worker thread
    const opts: Commander.OptionValues = WorkerThreads.workerData;
    Project.open(opts.project)
      .then(async (project) => {
        // build tasks
        const tasks = await options.tasks(project);

        // walk through tasks, executing each one
        await walkTaskTree<C>(tasks, async (task: Task<C>) => {
          // check if task should be skipped
          let skipResult: string | boolean;
          if (task.shouldSkip !== undefined) {
            skipResult = await task.shouldSkip();
          } else {
            // no shouldSkip function, assume the task should proceed
            skipResult = false;
          }
          new Message("shouldSkip", skipResult).send(); // notify ui
          if (skipResult !== false) {
            // don't continue walking down this branch
            return NextAction.NEXT_SIBLING;
          }

          // execute task
          if (task.fn !== undefined) {
            try {
              await task.fn(options.ctx, opts);
              new Message("fn").send();
            } catch (err) {
              /*
                Optionally, format the error before sending it to the UI thread.
                It is important to ensure this is done on the worker thread
                because the structured clone algorithm doesn't preserve the
                prototype chain. Therefore, instanceof checks for Error, but not
                for Error subtypes.
               */
              let error: Error = err;
              if (task.formatError !== undefined) {
                const message: string | void = task.formatError(error);
                if (message !== undefined) {
                  // error is expected, so don't show the stack trace
                  error = new BatterypackError(message, true);
                }
              }

              // send error to ui thread
              new Message("error", error).send();
              return NextAction.ABORT;
            }
          }

          // continue walking down this branch if there's anything left
          return NextAction.NORMAL;
        });
      })
      .catch((err) => {
        throw err;
      });
  }
}

interface ObserverHooks {
  onSkipResult?(result: string | boolean): void;
  onFnResolve?(): void;
  onFnError?(err: Error): void;
}

function makeUiListr<C>(
  hooks: ObserverHooks,
  tasks: readonly Task<C>[]
): Listr {
  return new Listr(
    tasks.map((task) => ({
      title: task.description,
      task: async (_, listrTask) => {
        const startTimeMs: number = Date.now();

        // task contains subtasks, start on those immediately
        if (task.tasks !== undefined) {
          return makeUiListr<C>(hooks, task.tasks);
        }

        // wait for a signal from the observer that the worker
        // has completed the task (that is, it ran Task.fn())
        // before proceeding
        if (task.fn !== undefined) {
          await new Promise<void>((resolve, reject) => {
            hooks.onFnResolve = resolve;
            hooks.onFnError = reject;
          });
        }

        // update description with total time
        const durationSec: number = (Date.now() - startTimeMs) / 1000;
        listrTask.title = `${listrTask.title} (${durationSec}s)`;
        return;
      },
      /*
        task.shouldSkip is cast to any because the type definition is wrong:
        the skip function can return a Promise which resolves with a string
        indicating the reason the task was skipped. This is not reflected in
        the type definition, however.
     */
      skip: () => {
        return new Promise<string | boolean>((resolve) => {
          hooks.onSkipResult = resolve;
        }) as any;
      },
    }))
  );
}

/**
 * Next action to take when traversing a task tree.
 */
enum NextAction {
  /**
   * Continue traversing the tree normally. If child nodes exist, traverse down
   * them. Then, traverse down siblings, if any exist.
   */
  NORMAL,
  /**
   * Do not traverse down child nodes for this branch. Instead, traverse down
   * siblings, if any exist.
   */
  NEXT_SIBLING,
  /**
   * Stop traversing and return.
   */
  ABORT,
}

/**
 * Recursively traverses a task tree, awaiting a function for each task.
 * The function is expected to resolve a value indicating the next action.
 */
async function walkTaskTree<C>(
  tasks: readonly Task<C>[],
  fn: (task: Task<C>) => Promise<NextAction>
): Promise<void> {
  for (const task of tasks) {
    const nextAction: NextAction = await fn(task);
    switch (nextAction) {
      case NextAction.NORMAL:
        if (task.tasks) {
          await walkTaskTree(task.tasks, fn);
        }
        break;
      case NextAction.NEXT_SIBLING:
        break;
      case NextAction.ABORT:
        return;
    }
  }
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
      "-p, --project <project>",
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
        // TODO: prettier error messages - use chalk?
        console.error(err.message);
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
 * Prints a tree of strings.
 *
 * @param root Root node
 */
export function formatTree(root: TreeNode<string>): string {
  let lines: string[] = [];

  function fn(node: TreeNode<string>, level: number): void {
    // format line
    let line: string = "";
    for (let i = 0; i < level; i++) {
      line += "│ ";
    }
    line += `└── ${node.value}`;
    lines.push(line);

    // recursively format children
    for (const child of node.children) {
      fn(child, level + 1);
    }
  }

  // format root and direct children of root
  lines.push(root.value);
  for (const child of root.children) {
    fn(child, 0);
  }

  // return lines
  return lines.join("\n");
}
