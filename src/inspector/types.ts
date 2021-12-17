export interface WorkerData {
  entrypointPath: string;
  tsConfig: any;
}

export type WorkerMessage = {
  type: "CIRCULAR_REFS";
  circularPaths: string[][];
};
