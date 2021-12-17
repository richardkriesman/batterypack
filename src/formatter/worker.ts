import * as FS from "fs";
import * as Prettier from "prettier";
import * as Thread from "worker_threads";

import {
  FormatMode,
  WorkerData,
  WorkerMessage,
} from "@project/formatter/types";

const FORMAT_OPTIONS: Prettier.Options = {
  parser: "typescript",
};

async function assert(filePaths: string[]): Promise<void> {
  const failedFilePaths: string[] = (
    await Promise.all<[string, boolean]>(
      filePaths.map((filePath: string) =>
        FS.promises
          .readFile(filePath)
          .then((fileContent: Buffer) => fileContent.toString("utf-8"))
          .then(
            (fileContent: string) =>
              [filePath, Prettier.check(fileContent, FORMAT_OPTIONS)] as [
                string,
                boolean
              ]
          )
      )
    )
  )
    .filter(([_, doesMatch]) => !doesMatch)
    .map(([filePath, _]) => filePath);
  if (failedFilePaths.length > 0) {
    Thread.parentPort!.postMessage({
      type: "ASSERT_FAILED",
      failedFilePaths,
    } as WorkerMessage);
    process.exit(1);
  }
}

async function format(filePaths: string[]): Promise<void> {
  await Promise.all(
    filePaths.map((filePath: string) =>
      FS.promises
        .readFile(filePath)
        .then((fileContent: Buffer) => fileContent.toString("utf-8"))
        .then((fileContent: string) =>
          Prettier.format(fileContent, FORMAT_OPTIONS)
        )
        .then((fileContent: string) =>
          FS.promises.writeFile(filePath, fileContent)
        )
    )
  );
}

if (!Thread.isMainThread) {
  const data: WorkerData = Thread.workerData;
  (() => {
    switch (data.mode) {
      case FormatMode.Assert:
        return assert(data.filePaths);
      case FormatMode.Format:
        return format(data.filePaths);
    }
  })().catch((err) => {
    throw err;
  });
}
