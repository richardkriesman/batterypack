import * as Path from "path";
import * as Thread from "worker_threads";

import { CompilerError } from "@project/compiler/error";
import { WorkerData, WorkerMessage } from "@project/compiler/types";
import { PathResolver, ProjectPaths } from "@project/paths";
import { Project } from "@project/project";
import { when } from "@project/when";
import { DEFAULT_TARGET } from "@project/meta";

const WORKER_FILE_PATH: string = Path.join(__dirname, "worker.js");

/**
 * Compiles a {@link PathResolver}'s source code, written in TypeScript, to
 * JavaScript or into an executable.
 */
export class Compiler {
  private readonly project: Project;

  public constructor(project: Project) {
    this.project = project;
  }

  /**
   * Generates the TypeScript compiler configuration that would be saved in
   * a tsconfig.json file.
   */
  public async generateConfigFileContents(): Promise<any> {
    return {
      compilerOptions: {
        allowJs: false,
        baseUrl: await this.project.resolver.resolve(ProjectPaths.dirs.source),
        composite: true,
        declaration: true,
        declarationMap: true,
        esModuleInterop: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        inlineSourceMap: true, // inline sources are needed to fix jest error line numbers
        inlineSources: true,
        lib: [this.project.config.build?.target ?? DEFAULT_TARGET],
        module: "commonjs",
        moduleResolution: "node",
        noImplicitAny: true,
        noImplicitOverride:
          this.project.config.build?.features?.requireExplicitOverride ?? false,
        noImplicitReturns: true,
        noImplicitThis: true,
        outDir: await this.project.resolver.resolve(ProjectPaths.dirs.build),
        paths: {
          "@project/*": ["*"],
        },
        preserveConstEnums: true,
        rootDir: await this.project.resolver.resolve(ProjectPaths.dirs.source),
        sourceMap: false, // disabled because sources are generated inline
        skipLibCheck: true,
        strictBindCallApply: true,
        strictFunctionTypes: true,
        strictNullChecks: true,
        stripInternal: true,
        target: this.project.config.build?.target ?? DEFAULT_TARGET,
        ...when(
          this.project.config.overrides,
          (target) => target["tsconfig.json"] ?? {}
        ),
      },
      include: [await this.project.resolver.resolve(ProjectPaths.dirs.source)],
      exclude: ["node_modules"],
      references:
        this.project.config.subprojects?.length ?? 0 > 0
          ? this.project.config.subprojects?.map((subprojectPath) => ({
              path: subprojectPath,
            }))
          : undefined,
    };
  }

  /**
   * Resolves project paths, parses compiler options, discovers source files,
   * then compiles the project's source code into a JavaScript program.
   *
   * Compilation occurs on a separate thread, so this method is non-blocking.
   *
   * @throws CompilerErrorSet - Compiler errors were encountered during build.
   */
  public compile(): Promise<void> {
    return Promise.all([
      this.project.resolver.resolve(ProjectPaths.root),
      this.generateConfigFileContents(),
    ]).then(
      ([basePath, config]) =>
        new Promise<void>((resolve, reject) => {
          // start a new worker thread to perform the compilation
          const worker = new Thread.Worker(WORKER_FILE_PATH, {
            workerData: {
              basePath,
              config,
            } as WorkerData,
          });

          // handle messages from the worker
          worker.on("message", (value: WorkerMessage) => {
            switch (value.type) {
              case "DIAGNOSTIC_MESSAGES":
                reject(new CompilerError(value.diagnostics));
                break;
              default:
                throw new TypeError(
                  `Unknown message from worker thread: ${value.type}`
                );
            }
          });

          // handle worker termination
          worker.on("exit", (exitCode) => {
            if (exitCode === 0) {
              resolve();
            }
          });

          // handle unexpected errors thrown
          worker.on("error", (err?: Error) => reject(err));
        })
    );
  }
}
