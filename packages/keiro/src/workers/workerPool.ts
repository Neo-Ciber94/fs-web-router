import { Worker, type WorkerOptions } from "node:worker_threads";

// https://github.com/vitest-dev/vitest/issues/5757#issuecomment-2126095729

const jsWorker = /* JavaScript */ `
  import { createRequire } from "node:module";
  import { workerData, threadId } from "node:worker_threads";

  const filename = "${import.meta.url}";
  const require = createRequire(filename);
  const { tsImport } = require("tsx/esm/api");
  
  tsImport(workerData.__ts_worker_filename, filename);
`;

class TsxWorker extends Worker {
  constructor(filename: string | URL, options: WorkerOptions = {}) {
    options.workerData ??= {};
    options.workerData.__ts_worker_filename = filename.toString();
    super(new URL(`data:text/javascript,${jsWorker}`), options);
  }
}

type QueueWorker = (worker: Worker) => void;

export abstract class WorkerPool {
  /**
   * Returns a promise that resolves to the next available `Worker`.
   */
  abstract take(): Promise<Worker>;

  /**
   * Returns a worker to the pool.
   */
  abstract return(worker: Worker): void;
}

const FIXED_POOL_WORKER = Symbol("FIXED_POOL_WORKER");

export class FixedWorkerPool extends WorkerPool {
  #workers: Worker[];
  #queue: QueueWorker[];

  constructor(workerCount: number, filename: string | URL, options?: WorkerOptions) {
    super();

    if (workerCount <= 0) {
      throw new Error("Worker count cannot be zero or negative");
    }

    const workers: Worker[] = [];

    for (let i = 0; i < workerCount; i++) {
      const worker = new TsxWorker(filename, options);

      // This is to detect which workers comes from this pool
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (worker as any)[FIXED_POOL_WORKER] = true;

      workers.push(worker);
    }

    this.#workers = workers;
    this.#queue = [];
  }

  /**
   * Returns the number of workers that will available to run tasks.
   */
  get available() {
    return this.#workers.length;
  }

  /**
   * Returns the total number of workers this pool contain.
   */
  get size() {
    return this.available + this.#queue.length;
  }

  take() {
    return new Promise<Worker>((resolve) => {
      const worker = this.#workers.pop();
      if (worker) {
        return resolve(worker);
      } else {
        this.#queue.push(resolve);
      }
    });
  }

  return(worker: Worker) {
    if (!(FIXED_POOL_WORKER in worker)) {
      return;
    }

    if (this.#queue.length > 0) {
      const resolve = this.#queue.pop()!;
      resolve(worker);
    } else {
      this.#workers.unshift(worker);
    }
  }
}

const DYNAMIC_POOL_WORKER = Symbol("DYNAMIC_POOL_WORKER");

export class DynamicWorkerPool extends WorkerPool {
  #workers: Worker[];
  #minWorkerCount: number;
  #workerThreadCount: number;

  // options
  #workerFilename: string | URL;
  #workerOptions: WorkerOptions | undefined;

  constructor(initialWorkerCount: number, filename: string | URL, options?: WorkerOptions) {
    super();

    if (initialWorkerCount <= 0) {
      throw new Error("Worker count cannot be zero or negative");
    }

    const workers: Worker[] = [];

    for (let i = 0; i < initialWorkerCount; i++) {
      const worker = new TsxWorker(filename, options);

      // This is to detect which workers comes from this pool
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (worker as any)[DYNAMIC_POOL_WORKER] = true;

      workers.push(worker);
    }

    this.#workers = workers;
    this.#minWorkerCount = initialWorkerCount;
    this.#workerFilename = filename;
    this.#workerOptions = options;
    this.#workerThreadCount = initialWorkerCount;
  }

  take(): Promise<Worker> {
    const worker = this.#workers.pop();

    if (worker) {
      this.#workerThreadCount -= 1;
      return Promise.resolve(worker);
    }

    const newWorker = new TsxWorker(this.#workerFilename, this.#workerOptions);

    // This is to detect which workers comes from this pool
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newWorker as any)[DYNAMIC_POOL_WORKER] = true;
    return Promise.resolve(newWorker);
  }

  return(worker: Worker): void {
    if (!(DYNAMIC_POOL_WORKER in worker)) {
      return;
    }

    // If we are full, we ignore the worker
    if (this.#workerThreadCount >= this.#minWorkerCount) {
      return;
    }

    this.#workerThreadCount += 1;
    this.#workers.push(worker);
  }
}
