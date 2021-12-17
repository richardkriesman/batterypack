import * as OS from "os";

import { HumanReadable } from "@project/types";

export class FormatAssertionError extends Error implements HumanReadable {
  public readonly fileNames: readonly string[];

  public constructor(fileNames: string[]) {
    super("One or more files do not conform to Prettier's style");
    this.name = "FormatAssertionError";
    this.fileNames = fileNames;
  }

  public toHumanReadable(): string {
    return [
      "One or more files do not conform to Prettier's style:",
      ...this.fileNames.map((fileName) => `  ${fileName}`),
      "Rebuild your project to fix this error.",
    ].join(OS.EOL);
  }
}
