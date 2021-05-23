import * as FS from "fs";
import * as YAML from "js-yaml";

import { File } from "@project/io";

/**
 * A persistent object storage interface which proxies property accesses to a
 * backing data store.
 */
export type LoadedStore<S extends Store<T>, T extends object> = S & T;

abstract class Store<T extends object> {
  protected readonly _data: T;

  protected constructor(data: T) {
    this._data = data;
  }

  /**
   * Wraps a {@link Store} in a proxy object, allowing overloading of
   * dynamic property accesses.
   *
   * @private
   */
  protected static bindDynamicAccessors<S extends Store<T>, T extends object>(
    store: S
  ): LoadedStore<S, T> {
    return new Proxy(store, {
      get: (target: Store<T>, p: PropertyKey): any => {
        return target.onPropertyGet(p as any);
      },
      set(target: Store<T>, p: PropertyKey, value: any): boolean {
        return target.onPropertySet(p as any, value);
      },
    }) as LoadedStore<S, T>;
  }

  /**
   * Handles a property lookup.
   *
   * @private
   */
  private onPropertyGet(key: string): this | T | undefined {
    if (key in this) {
      return (this as any)[key];
    } else {
      return (this._data as any)[key];
    }
  }

  /**
   * Handles a property set.
   *
   * @private
   */
  private onPropertySet(key: string, value: any): boolean {
    (this._data as any)[key] = value;
    return true;
  }
}

/**
 * A store that supports reading and writing to a YAML file.
 *
 * @typeVar T - Object schema type
 */
export abstract class YamlStore<T extends object> extends Store<T> {
  /**
   * Reads a {@link YamlStore} file, returning `undefined` no such file exists.
   *
   * @private
   */
  protected static async readData<T extends object>(
    path: string
  ): Promise<T | undefined> {
    // if file does not exist, return undefined
    if (!(await new File(path).doesExist())) {
      return undefined;
    }

    // load file
    const file = (await FS.promises.readFile(path)).toString("utf-8");
    return YAML.load(file) as T;
  }

  private readonly _path: string;

  protected constructor(data: T, path: string) {
    super(data);
    this._path = path;
  }

  /**
   * Flush the persistence file to disk.
   */
  public async flush(): Promise<void> {
    await FS.promises.writeFile(this._path, YAML.dump(this._data));
  }
}
