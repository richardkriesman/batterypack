import { Validator } from "jsonschema";
import * as YAML from "js-yaml";

import { File } from "@project/io";

export interface YamlEntity {
  save(): Promise<void>;
}

export class YamlModel<T extends YamlEntity> {
  readonly schema: object;

  readonly #validator: Validator;

  constructor(schema: object) {
    this.schema = schema;
    this.#validator = new Validator();
  }

  async open(path: string): Promise<T> {
    const file = new File(path);

    // check if file exists
    if (!(await file.doesExist())) {
      throw new FileNotFoundError(path);
    }

    // read and parse file
    const payload = YAML.load((await file.readAll()).toString("utf-8"));

    // ensure file matches schema
    this.#validator.validate(payload, this.schema, {
      throwAll: true,
    });

    // add save function to entity
    Object.defineProperty(payload, "save", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: (): Promise<void> =>
        file.writeAll(Buffer.from(YAML.dump(payload), "utf-8")),
    });

    return payload as T;
  }
}

export class FileNotFoundError extends Error {
  constructor(path: string) {
    super(`File was not found at path ${path}.`);
  }
}
