/**
 * Recursively makes a type {@link Readonly}.
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;
interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}
type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/**
 * Recursively freezes an object using {@link Object.freeze}.
 */
export function deepFreeze<T extends object>(obj: T): DeepReadonly<T> {
  if (obj === null || obj === undefined) {
    return obj;
  }
  for (const prop of Object.keys(obj)) {
    if (typeof (obj as any)[prop] === "object") {
      deepFreeze((obj as any)[prop]);
    }
  }
  return Object.freeze(obj) as DeepReadonly<T>;
}
