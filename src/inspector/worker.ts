import madge from "madge";
import * as Thread from "worker_threads";

import { WorkerData, WorkerMessage } from "@project/inspector/types";

function main(data: WorkerData): void {
  madge(data.entrypointPath, {
    tsConfig: data.tsConfig,
    fileExtensions: ["ts", "tsx"],
  })
    .then((madgeObj) => madgeObj.circular())
    .then((circularPaths) => {
      if (circularPaths.length > 0) {
        Thread.parentPort!.postMessage({
          type: "CIRCULAR_REFS",
          circularPaths,
        } as WorkerMessage);
        process.exit(1);
      }
    })
    .catch((err) => {
      throw err;
    });
}

if (!Thread.isMainThread) {
  main(Thread.workerData as WorkerData);
}
