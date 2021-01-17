import Ora from "ora";

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
