import FS from "fs";

/**
 * Determines whether a file exists at the specified path.
 */
export async function doesFileExist(path: string): Promise<boolean> {
  try {
    const stat = await FS.promises.stat(path);
    return stat.isFile();
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

/**
 * When `target` is neither `null` nor `undefined`, `out` will be returned.
 *
 * If `out` is a function, it will be invoked, passing `target` and expecting
 * an object to merge.
 *
 * @example
 * {
 *   foo: "bar",
 *   ...when(somePossiblyUndefinedObject, {
 *     key: "value"
 *   })
 * }
 *
 *
 * @example
 * {
 *   foo: "bar",
 *   ...when(somePossiblyUndefinedObject, target => {
 *     key: target.value
 *   })
 * }
 */
export function when<T, O extends { [key: string]: unknown }>(
  target: T,
  out: ((target: NonNullable<T>) => O) | O
): Partial<O> {
  return target !== undefined && target !== null
    ? typeof out === "function"
      ? out(target!)
      : out
    : {};
}
