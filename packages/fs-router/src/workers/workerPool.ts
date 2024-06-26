import { Worker, type WorkerOptions } from "worker_threads";

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
      workers.push(new Worker(filename, options));
    }

    console.log(`Created ${workers.length} worker threads`);
    this.#workers = workers;
    this.#queue = [];
  }

  get() {
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
      this.#workers.push(worker);
    }
  }
}
