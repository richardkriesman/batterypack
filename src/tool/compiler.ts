import * as TypeScript from "typescript";
import { PathResolver, ProjectPaths } from "../path";
import { default as createKeyTransformer } from "ts-transformer-keys/transformer";
import { default as createPathTransformer } from "@zerollup/ts-transform-paths";

/**
 * TypeScript compiler configuration. This is equivalent to what would be found
 * in tsconfig.json.
 */
export async function makeCompilerConfig(resolver: PathResolver) {
  return {
    compilerOptions: {
      allowJs: false,
      baseUrl: await resolver.resolve(ProjectPaths.dirs.source),
      declaration: true,
      esModuleInterop: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      incremental: true,
      lib: ["ES2020"],
      module: "commonjs",
      moduleResolution: "node",
      noImplicitAny: true,
      noImplicitReturns: true,
      noImplicitThis: true,
      outDir: await resolver.resolve(ProjectPaths.dirs.build),
      paths: {
        "@project/*": ["*"],
      },
      preserveConstEnums: true,
      rootDir: await resolver.resolve(ProjectPaths.dirs.source),
      sourceMap: true,
      strictBindCallApply: true,
      strictFunctionTypes: true,
      strictNullChecks: true,
      stripInternal: true,
      target: "ES2020",
      tsBuildInfoFile: await resolver.resolve(ProjectPaths.files.buildInfo),
    },
    include: [await resolver.resolve(ProjectPaths.dirs.source)],
    exclude: ["node_modules", "**/__tests__/*"],
  };
}

/**
 * Compiles a {@link PathResolver}'s source code, written in TypeScript, to
 * JavaScript.
 */
export class Compiler {
  private readonly resolver: PathResolver;

  public constructor(resolver: PathResolver) {
    this.resolver = resolver;
  }

  /**
   * Creates a {@link CompilationUnit} by resolving paths, parsing compiler
   * options, and discovering source files. This CompilationUnit can then be
   * compiled into a JavaScript program.
   */
  public async prepare(): Promise<CompilationUnit> {
    // parse config
    const config = await makeCompilerConfig(this.resolver);
    const commandLine = TypeScript.parseJsonConfigFileContent(
      config,
      TypeScript.sys,
      await this.resolver.resolve(ProjectPaths.root)
    );

    // create a program (in a compiler context)
    const program: TypeScript.Program = TypeScript.createProgram({
      rootNames: commandLine.fileNames,
      options: commandLine.options,
    });

    // build transformer factories
    const pathTransformer = createPathTransformer(program);
    const transformers: TypeScript.CustomTransformers = {
      afterDeclarations: [pathTransformer.afterDeclarations!],
      before: [createKeyTransformer(program), pathTransformer.before!],
    };

    return new CompilationUnit(program, transformers);
  }
}

/**
 * An immutable representation of a TypeScript program, consisting of a set
 * of source files and compiler options.
 */
export class CompilationUnit {
  private readonly program: TypeScript.Program;
  private readonly transformers: TypeScript.CustomTransformers;

  public constructor(
    program: TypeScript.Program,
    transformers: TypeScript.CustomTransformers
  ) {
    this.program = program;
    this.transformers = transformers;
  }

  /**
   * Compiles the unit's source code.
   *
   * @throws CompilerErrorSet - Compiler errors were encountered during build.
   */
  public build(): void {
    // emit output files
    const result: TypeScript.EmitResult = this.program.emit(
      undefined,
      undefined,
      undefined,
      false,
      this.transformers
    );

    // combine diagnostics from compilation with any pre-emit diagnostics
    const diagnostics = TypeScript.getPreEmitDiagnostics(this.program).concat(
      result.diagnostics
    );

    // print diagnostic messages if any were returned
    const errors: CompilerError[] = diagnostics.map(
      (diagnostic) => new CompilerError(diagnostic)
    );
    if (errors.length > 0) {
      throw new CompilerErrorSet(errors);
    }
  }
}

export class CompilerErrorSet extends Error {
  public readonly errors: readonly CompilerError[];

  public constructor(errors: CompilerError[]) {
    const messages: string[] = [];
    for (const error of errors) {
      messages.push(error.message);
    }
    super(messages.join("\n\n"));
    this.errors = errors;
  }
}

export class CompilerError extends Error {
  public readonly diagnostic: TypeScript.Diagnostic;

  public readonly diagnosticCode: string;
  public readonly location?: string;
  public readonly messageText: string;

  public constructor(diagnostic: TypeScript.Diagnostic) {
    // format diagnostic message
    let output: string;
    const diagnosticCode: string = `TS${diagnostic.code}`;
    const message: string = TypeScript.flattenDiagnosticMessageText(
      diagnostic.messageText,
      "\n",
      4
    );
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!
      );
      output =
        `[TS${diagnostic.code}] ${diagnostic.file.fileName}@${line + 1}:${
          character + 1
        }: ` + message;
    } else {
      output = `[TS${diagnostic.code}] ${message}`;
    }

    // construct error
    super(output);
    this.diagnostic = diagnostic;
    this.diagnosticCode = diagnosticCode;
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!
      );
      this.location = `${diagnostic.file.fileName}@${line + 1}:${
        character + 1
      }`;
    }
    this.messageText = message;
  }
}
