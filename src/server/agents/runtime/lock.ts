/** Minimal async mutex: serializes critical sections (e.g. dependency installs) across parallel agents. */
export class AsyncLock {
  private tail: Promise<void> = Promise.resolve();

  async run<T>(task: () => Promise<T>): Promise<T> {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => (release = resolve));
    await previous;
    try {
      return await task();
    } finally {
      release();
    }
  }
}
