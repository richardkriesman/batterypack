import { Project } from "@project/project";
import { ProjectPaths } from "@project/paths";

export type TypescriptTargets =
  | "ES2015"
  | "ES2016"
  | "ES2017"
  | "ES2018"
  | "ES2019"
  | "ES2020"
  | "ESNext";

export const DEFAULT_TARGET: TypescriptTargets = "ES2020";

export interface CompilerConfigOptions {
  /**
   * Path to the build output directory.
   */
  buildPath: string;
  /**
   * Whether to exclude __tests__ directories from the build.
   */
  excludeTests?: boolean;
  /**
   * Path to the source code directory.
   */
  sourcePath: string;
  /**
   * List of subprojects to link.
   */
  subprojects?: readonly Project[];
  /**
   * Build target.
   */
  target?: TypescriptTargets;
  /**
   * Whether to use legacy (CommonJS) modules instead of native ES modules.
   */
  useLegacyModules?: boolean;
}

/**
 * TypeScript compiler configuration. This is equivalent to what would be found
 * in tsconfig.json.
 */
export async function makeTypescriptConfig(options: CompilerConfigOptions) {
  const subprojects: readonly Project[] = options.subprojects ?? [];
  return {
    compilerOptions: {
      allowJs: false,
      baseUrl: options.sourcePath,
      composite: true,
      declaration: true,
      declarationMap: true,
      esModuleInterop: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      // lib: [project.config.build?.target ?? DEFAULT_TARGET],
      lib: [options.target ?? DEFAULT_TARGET],
      module:
        options.useLegacyModules || options.useLegacyModules === undefined
          ? "commonjs"
          : "ES2020",
      moduleResolution: "node",
      noImplicitAny: true,
      noImplicitReturns: true,
      noImplicitThis: true,
      outDir: options.buildPath,
      paths: {
        "@project/*": ["*"],
        /*
          Map subproject names to paths. This helps IDEs discover types and
          documentation for subprojects.
         */
        ...Object.fromEntries(
          await Promise.all(
            subprojects.map(async (subproject) => [
              subproject.config.name,
              [await subproject.resolver.resolve(ProjectPaths.root)],
            ])
          )
        ),
      },
      preserveConstEnums: true,
      rootDir: options.sourcePath,
      sourceMap: true,
      strictBindCallApply: true,
      strictFunctionTypes: true,
      strictNullChecks: true,
      stripInternal: true,
      target: options.target ?? DEFAULT_TARGET,
    },
    include: [options.sourcePath],
    exclude: ["node_modules"].concat(
      options.excludeTests ? ["**/__tests__/*"] : []
    ),
    references: await Promise.all(
      subprojects.map(async (subproject) => ({
        path: await subproject.resolver.resolve(ProjectPaths.root),
      }))
    ),
  };
}
