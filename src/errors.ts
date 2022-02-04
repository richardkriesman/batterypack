import { ValidationError } from "jsonschema";

export class BatterypackError extends Error {
  public readonly showMinimal: boolean;

  /**
   * Creates a new {@link BatterypackError}.
   *
   * @param message Message to display
   * @param showMinimal Whether to only show the message when printing the
   *                    error, excluding the name and stack trace.
   */
  public constructor(message?: string, showMinimal: boolean = false) {
    super(message);
    this.showMinimal = showMinimal;
    if (this.showMinimal) {
      // remove the actual stack trace, leaving just the message
      this.stack = message;
    }
  }
}

export class ConfigSchemaError extends BatterypackError {
  public constructor(
    filePath: string,
    err: ValidationError,
    showMinimal: boolean = false
  ) {
    super(`${filePath} ${err.message}`, showMinimal);
  }
}

export class ConfigMissingError extends BatterypackError {
  public constructor(filePath: string, showMinimal: boolean = false) {
    super(
      `batterypack configuration file is missing at ${filePath}.`,
      showMinimal
    );
  }
}

export class ConfigVersionMismatchError extends BatterypackError {
  public constructor(
    filePath: string,
    version: string,
    showMinimal: boolean = false
  ) {
    super(
      `This version of batterypack is not supported by the project whose ` +
        `configuration file is stored at ${filePath}. The version expected ` +
        `is ${version}.`,
      showMinimal
    );
  }
}
