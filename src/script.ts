import * as WorkerThreads from "worker_threads";

export interface Job<P> {
  fileName: string;
  props: P;
}

export interface JobResult<R> {
  err?: Error;
  value: R;
}

/**
 * An abstraction around {@link WorkerThreads} for running CPU-intensive
 * operations in Node.
 */
export class Script<P = {}, R = void> {
  public static run<P = {}, R = void>(
    fileName: string,
    props: P
  ): Script<P, R> {
    return new Script<P, R>(fileName, props);
  }

  private readonly promise: Promise<R>;
  private resolve: (value: R | PromiseLike<R>) => void;
  private reject: (reason?: any) => void;

  private constructor(fileName: string, props: P) {
    // get resolve and reject
    this.promise = new Promise<R>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    // start the worker
    const worker = new WorkerThreads.Worker(fileName, {
      workerData: {
        fileName: fileName,
        props: props,
      } as Job<P>,
    });
    worker.on("message", this.onResult.bind(this));
    worker.on("error", this.reject);
    worker.on("exit", this.onExit.bind(this));
  }

  public wait(): Promise<R> {
    return this.promise;
  }

  private onResult(message: JobResult<R>): void {
    if (message.err) {
      this.reject(message.err);
    } else {
      this.resolve(message.value);
    }
  }

  private onExit(code: number): void {
    if (code !== 0) {
      this.reject(new Error(`Worker stopped with exit code ${code}`));
    }
  }
}
