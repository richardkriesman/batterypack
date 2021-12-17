import Path from "path";
import * as Thread from "worker_threads";

import { FormatAssertionError } from "@project/formatter/error";
import {
  FormatMode,
  WorkerData,
  WorkerMessage,
} from "@project/formatter/types";
import { PathResolver, ProjectPaths } from "@project/paths";

const WORKER_FILE_PATH: string = Path.join(__dirname, "worker.js");

/**
 * Formats the project's source code in the Prettier style.
 */
export class Formatter {
  private readonly resolver: PathResolver;

  public constructor(resolver: PathResolver) {
    this.resolver = resolver;
  }

  /**
   * Asserts that the project's source code is in the Prettier style.
   *
   * @throws FormatAssertionError
   */
  public assert(): Promise<void> {
    return this.runWorker(FormatMode.Assert);
  }

  /**
   * Formats the project's source code in the Prettier style.
   */
  public format(): Promise<void> {
    return this.runWorker(FormatMode.Format);
  }

  private async runWorker(mode: FormatMode): Promise<void> {
    // build a list of file paths to format
    const filePaths: string[] = [];
    const sourcePath: string = await this.resolver.resolve(
      ProjectPaths.dirs.source
    );
    for await (const [path, isDir] of this.resolver.walk(sourcePath)) {
      if (!(path.endsWith(".ts") || path.endsWith(".tsx")) || isDir) {
        continue;
      }
      filePaths.push(path);
    }

    // start a new worker thread to perform the formatting
    await new Promise<void>((resolve, reject) => {
      const worker = new Thread.Worker(WORKER_FILE_PATH, {
        workerData: {
          mode,
          filePaths,
        } as WorkerData,
      });

      // handle messages from the worker
      worker.on("message", (value: WorkerMessage) => {
        switch (value.type) {
          case "ASSERT_FAILED":
            reject(new FormatAssertionError(value.failedFilePaths));
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
    });
  }
}
