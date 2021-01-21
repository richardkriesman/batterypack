import madge from "madge";
import { makeCompilerConfig } from "./compiler";
import { PathResolver, ProjectPaths } from "../path";

/**
 * Analyzes the project's source code to detect potential issues.
 */
export class Detective {
  private readonly resolver: PathResolver;

  public constructor(resolver: PathResolver) {
    this.resolver = resolver;
  }

  /**
   * Assert that no circular dependencies exist in the project's source code.
   *
   * @throws DetectiveError - Circular dependencies were detected.
   */
  public async assertNoCircularDependencies(): Promise<void> {
    const entrypointPath: string = await this.resolver.resolve(
      ProjectPaths.files.sourceEntrypoint
    );
    const madgeObj = await madge(entrypointPath, {
      tsConfig: makeCompilerConfig(this.resolver),
      fileExtensions: ["ts", "tsx"],
    });
    const circles: string[][] = madgeObj.circular();
    if (circles.length > 0) {
      throw new CircularDependencyError(circles);
    }
  }
}

/**
 * The {@link Detective} found an issue in the project's source code.
 */
export class DetectiveError extends Error {
  public constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, DetectiveError.prototype);
    this.name = "DetectiveError";
  }
}

/**
 * The {@link Detective} found one or more circular dependencies in the
 * project's source code.
 */
export class CircularDependencyError extends DetectiveError {
  public readonly circles: readonly (readonly string[])[];

  public constructor(circles: string[][]) {
    super();
    Object.setPrototypeOf(this, CircularDependencyError.prototype);
    this.name = "CircularDependencyError";
    this.circles = circles;
  }
}