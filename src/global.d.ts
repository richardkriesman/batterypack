declare module "madge" {
  // noinspection JSUnusedGlobalSymbols - shush you, it is being used
  export default function (
    path: string | string[] | object,
    config: MadgeConfig
  ): Promise<Madge>;
  export type MadgeConfig = {
    // This list is not exhaustive - just the params I bothered to document
    fileExtensions?: string[];
    tsConfig?: string | object;
  };

  export type Madge = {
    obj(): DependencyMap;
    warnings(): Warnings;
    circular(): string[][];
    circularGraph(): DependencyMap;
    depends(): string[];
    orphans(): string[];
    leaves(): string[];
    dot(circularOnly?: boolean): Promise<any>;
    image(imagePath: string, circularOnly?: boolean): Promise<string>;
    svg(): Promise<Buffer>;
  };

  export type DependencyMap = {
    [fileName: string]: string[];
  };

  export type Warnings = {
    skipped: string[];
  };
}
