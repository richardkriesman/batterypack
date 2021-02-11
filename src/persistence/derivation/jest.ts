import * as Path from "path";

import { Derivation } from "@project/persistence";
import { Project } from "@project/project";
import { ProjectPaths } from "@project/paths";

/**
 * Builds a jest.config.js file to configure Jest.
 */
export class JestDerivation implements Derivation {
  filePath: string = "jest.config.js";
  toolId: string = "jest";

  public async makeDerivation(project: Project): Promise<Buffer> {
    const content = JSON.stringify(await generateJestConfig(project), null, 2);
    return Buffer.from(`module.exports = ${content};`);
  }
}

/**
 * Generates a Jest configuration object for a {@link Project}.
 */
async function generateJestConfig(project: Project) {
  return {
    displayName:
      project.config.name ??
      (await project.resolver.resolve(ProjectPaths.dirs.source)),
    rootDir: await project.resolver.resolve(ProjectPaths.dirs.source),
    testEnvironment: "node",
    transform: {
      "^.+\\.tsx?$": Path.resolve(
        Path.join(require.resolve("ts-jest"), "..", "..")
      ),
    },
    testMatch: ["**/__tests__/**/*.+(ts|tsx)"],
    moduleNameMapper: {
      "^@project/(.*)$": Path.join(
        await project.resolver.resolve(ProjectPaths.dirs.source),
        "$1"
      ),
    },
    collectCoverage: !!project.config.unitTest?.coverage?.enabled,
    coveragePathIgnorePatterns: project.config.unitTest?.coverage?.ignore,
    coverageThreshold: project.config.unitTest?.coverage?.rules
      ? {
          global: {
            branches: project.config.unitTest.coverage.rules.minBranchCoverage,
            functions:
              project.config.unitTest.coverage.rules.minFunctionCoverage,
            lines: project.config.unitTest.coverage.rules.minLineCoverage,
            statements:
              project.config.unitTest.coverage.rules.minStatementCoverage,
          },
        }
      : undefined,
  };
}
