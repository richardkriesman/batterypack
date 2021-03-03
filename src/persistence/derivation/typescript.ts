import { Buffer } from "buffer";

import { Derivation } from "./abstract";
import { makeCompilerConfig } from "../../tool/compiler";
import { Project } from "../../project";

/**
 * Builds a tsconfig.json file to configure TypeScript. This file doesn't
 * *need* to exist because batterypack takes care of compiling, but it's nice to
 * have for configuring IDEs.
 */
export class TypeScriptDerivation implements Derivation {
  filePath = "tsconfig.json";
  toolId = "typescript";

  public async makeDerivation(project: Project): Promise<Buffer> {
    const contents = {
      _warning:
        "This file is automatically generated by batterypack. " +
        "Changes will be overwritten!",
      // tests are included in tsconfig.json to work around module resolution
      // issues in WebStorm
      ...(await makeCompilerConfig(project, false)),
    };
    return Buffer.from(JSON.stringify(contents, null, 2), "utf-8");
  }
}
