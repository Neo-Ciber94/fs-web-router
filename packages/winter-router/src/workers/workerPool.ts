import { Worker, type WorkerOptions } from "node:worker_threads";

const jsWorker = /* JavaScript */ `
  import { createRequire } from "node:module";
  import { workerData, threadId } from "node:worker_threads";

  const filename = "${import.meta.url}";
  const require = createRequire(filename);
  const { tsImport } = require("tsx/esm/api");
  
  console.log("Loading worker: ", threadId);
  tsImport(workerData.__ts_worker_filename, filename).finally(() => {
    console.log("Worker loaded successfully: ", threadId)
  })
`;

class TsxWorker extends Worker {
  constructor(filename: string | URL, options: WorkerOptions = {}) {
    options.workerData ??= {};
    options.workerData.__ts_worker_filename = filename.toString();
    super(new URL(`data:text/javascript,${jsWorker}`), options);
  }
}

type QueueWorker = (worker: Worker) => void;

export class WorkerPool {
  #workers: Worker[];
  #queue: QueueWorker[];

  constructor(workerCount: number, filename: string | URL, options?: WorkerOptions) {
    if (workerCount <= 0) {
      throw new Error("Worker count cannot be zero or negative");
    }

    const workers: Worker[] = [];

    for (let i = 0; i < workerCount; i++) {
      workers.push(new TsxWorker(filename, options));
    }

    console.log(`Spawned ${workerCount} workers`)
    this.#workers = workers;
    this.#queue = [];
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

  // This is an unsafe operation, we don't know if the worker actually is part of this pool
  return(worker: Worker) {
    if (this.#queue.length > 0) {
      const resolve = this.#queue.pop()!;
      resolve(worker);
    } else {
      this.#workers.unshift(worker);
    }
  }
}
