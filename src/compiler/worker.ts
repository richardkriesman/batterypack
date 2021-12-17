import * as TypeScript from "typescript";
import { default as createKeyTransformer } from "ts-transformer-keys/transformer";
import { default as createPathTransformer } from "typescript-transform-paths";
import * as Thread from "worker_threads";

import {
  DiagnosticInfo,
  WorkerData,
  WorkerMessage,
} from "@project/compiler/types";

function main(data: WorkerData): void {
  // parse config
  const commandLine: TypeScript.ParsedCommandLine =
    TypeScript.parseJsonConfigFileContent(
      data.config,
      TypeScript.sys,
      data.basePath
    );

  // create a program (in a compiler context)
  const program: TypeScript.Program = TypeScript.createProgram({
    rootNames: commandLine.fileNames,
    options: commandLine.options,
  });

  // build transformer factories
  const transformers: TypeScript.CustomTransformers = {
    afterDeclarations: [
      createPathTransformer(
        program,
        {
          afterDeclarations: true,
        },
        {
          ts: undefined,
        }
      ),
    ],
    before: [
      createKeyTransformer(program),
      createPathTransformer(
        program,
        {
          afterDeclarations: false,
        },
        {
          ts: undefined,
        }
      ),
    ],
  };

  // emit output files
  const result: TypeScript.EmitResult = program.emit(
    undefined,
    undefined,
    undefined,
    false,
    transformers
  );

  // combine diagnostics from compilation with any pre-emit diagnostics, then
  // format them to send across to the UI thread so an error can be build
  const diagnostics: DiagnosticInfo[] = TypeScript.getPreEmitDiagnostics(
    program
  )
    .concat(result.diagnostics)
    .map((diagnostic) => ({
      code: `TS${diagnostic.code}`,
      location: (() => {
        if (diagnostic.file) {
          const { line, character } =
            diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
          return `${diagnostic.file.fileName}@${line + 1}:${character + 1}`;
        }
        return undefined;
      })(),
      message: TypeScript.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n",
        2
      ),
    }));

  if (diagnostics.length > 0) {
    // errors aren't serialized correctly by the structured clone algorithm,
    // so send the diagnostic messages across and let the UI thread
    // construct the error object
    Thread.parentPort!.postMessage({
      type: "DIAGNOSTIC_MESSAGES",
      diagnostics,
    } as WorkerMessage);
    process.exit(1);
  }
}

if (!Thread.isMainThread) {
  main(Thread.workerData as WorkerData);
}
