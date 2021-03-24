import { ValidationError } from "jsonschema";

export class ConfigSchemaError extends Error {
  public constructor(filePath: string, err: ValidationError) {
    super(`${filePath} ${err.message}`);
    this.name = "ConfigSchemaError";
  }
}

export class ConfigMissingError extends Error {
  public constructor(filePath: string) {
    super(`batterypack configuration file is missing at ${filePath}.`);
    this.name = "ConfigMissingError";
  }
}

export class ConfigVersionMismatchError extends Error {
  public constructor(filePath: string, version: string) {
    super(
      `This version of batterypack is not supported by the project whose ` +
        `configuration file is stored at ${filePath}. The version expected ` +
        `is ${version}.`
    );
    this.name = "ConfigVersionMismatchError";
  }
}
