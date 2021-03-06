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

/**
 * Works identically to {@link when}, but `out` is an async function.
 */
export async function whenAsync<T, O extends { [key: string]: unknown }>(
  target: T,
  out: (target: NonNullable<T>) => Promise<O>
): Promise<Partial<O>> {
  return target !== undefined && target !== null
    ? typeof out === "function"
      ? await out(target!)
      : out
    : {};
}
