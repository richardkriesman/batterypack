import * as Path from "path";
import * as Thread from "worker_threads";

import { Compiler } from "@project/compiler";
import { CircularDependencyError } from "@project/inspector/error";
import { WorkerData, WorkerMessage } from "@project/inspector/types";
import { Project } from "@project/project";

const WORKER_FILE_PATH: string = Path.join(__dirname, "worker.js");

/**
 * Analyzes the project's source code to detect potential issues.
 */
export class Inspector {
  private readonly project: Project;

  public constructor(project: Project) {
    this.project = project;
  }

  /**
   * Assert that no circular dependencies exist in the project's source code.
   *
   * @throws DetectiveError - Circular dependencies were detected.
   */
  public async assertNoCircularDependencies(): Promise<void> {
    return Promise.all([
      await this.project.getSourceEntrypoint(),
      await new Compiler(this.project).generateConfigFileContents(),
    ]).then(
      ([entrypointPath, tsConfig]) =>
        new Promise<void>((resolve, reject) => {
          // start a new worker thread to perform the inspection
          const worker = new Thread.Worker(WORKER_FILE_PATH, {
            workerData: {
              entrypointPath,
              tsConfig,
            } as WorkerData,
          });

          // handle messages from the worker
          worker.on("message", (value: WorkerMessage) => {
            switch (value.type) {
              case "CIRCULAR_REFS":
                reject(new CircularDependencyError(value.circularPaths));
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
