export interface WorkerData {
  basePath: string;
  config: any;
}

export type WorkerMessage = {
  type: "DIAGNOSTIC_MESSAGES";
  diagnostics: DiagnosticInfo[];
};

export interface DiagnosticInfo {
  code: string;
  location?: string;
  message: string;
}
