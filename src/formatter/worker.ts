import * as FS from "fs/promises";
import * as Path from "path";
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
        FS.readFile(filePath)
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
    filePaths
      // determine the temporary path to write the format
      .map((filePath: string) => [
        filePath,
        Path.join(Path.dirname(filePath), `.${Path.basename(filePath)}.tmp`),
      ])
      .map(([originalPath, formattedPath]) =>
        FS
          // read file to string
          .readFile(originalPath)
          .then((fileContent: Buffer) => fileContent.toString("utf-8"))
          // format file
          .then((fileContent: string) =>
            Prettier.format(fileContent, FORMAT_OPTIONS)
          )
          // write to a temporary path (non-atomic)
          .then((fileContent: string) =>
            FS.writeFile(formattedPath, fileContent)
          )
          // overwrite original file (atomic)
          .then(() => FS.rename(formattedPath, originalPath))
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
