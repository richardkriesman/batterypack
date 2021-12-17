export enum FormatMode {
  Assert,
  Format,
}

export interface WorkerData {
  filePaths: string[];
  mode: FormatMode;
}

export type WorkerMessage = {
  type: "ASSERT_FAILED";
  failedFilePaths: string[];
};
