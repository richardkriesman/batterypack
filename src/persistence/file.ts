import * as FS from "fs";
import * as YAML from "js-yaml";

import { doesFileExist } from "../helpers";

export type PersistenceFile<T extends object> = YamlFile<T> & T;

/**
 * Reads and writes to a file a YAML file.
 */
export abstract class YamlFile<T extends object> {
  /**
   * Reads a {@link YamlFile}, returning `undefined` no such file exists.
   *
   * @private
   */
  protected static async readFile<T extends object>(
    path: string
  ): Promise<T | undefined> {
    // if file does not exist, return undefined
    if (!(await doesFileExist(path))) {
      return undefined;
    }

    // load file
    const file = (await FS.promises.readFile(path)).toString("utf-8");
    return YAML.load(file) as T;
  }

  /**
   * Wraps a {@link YamlFile} in a proxy object, allowing overloading of
   * dynamic property accesses.
   *
   * @private
   */
  protected static bindDynamicAccessors<T extends object>(
    file: YamlFile<T>
  ): PersistenceFile<T> {
    return new Proxy(file, {
      get: (target: YamlFile<T>, p: PropertyKey): any => {
        return target.onPropertyGet(p as any);
      },
      set(target: YamlFile<T>, p: PropertyKey, value: any): boolean {
        return target.onPropertySet(p as any, value);
      },
    }) as PersistenceFile<T>;
  }

  private readonly _data: T;
  private readonly _path: string;

  protected constructor(path: string, data: T) {
    this._path = path;
    this._data = data;
  }

  /**
   * Flush the persistence file to disk.
   */
  public async flush(): Promise<void> {
    await FS.promises.writeFile(this._path, YAML.dump(this._data));
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
