interface ApplicationErrorOptions {
  status?: number;
}

export class ApplicationError extends Error {
  readonly status: number;

  constructor(message: string, opts?: ApplicationErrorOptions) {
    super(message);
    this.status = opts?.status ?? 400;
  }
}
