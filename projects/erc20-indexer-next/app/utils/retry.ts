
type Action<O> = () => Promise<O>;
type RetryPredicate = (error: unknown) => boolean;


export async function withRetry<T>(
  action: Action<T>,
  shouldRetry: RetryPredicate = () => true,
  maxAttempts = 3,
): Promise<RetryResult<T>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return { result: await action(), attempts: attempt };
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts || !shouldRetry(err)) break;
    }
  }
  throw new RetryError(`Failed after ${maxAttempts} attempts`, maxAttempts);
}

interface RetryResult<T> {
    result: T,
    attempts: number
}

class RetryError extends Error {
    public attempts: number;

    constructor(reason: string, attempts: number) {
        super(reason);
        this.attempts = attempts;
    }
}