import { describe, expect, it } from "vitest";

import { AsyncLock } from "./lock";

describe("AsyncLock", () => {
  it("serializes critical sections in call order", async () => {
    const lock = new AsyncLock();
    const order: string[] = [];
    const task = (name: string, ms: number) =>
      lock.run(async () => {
        order.push(`${name}:start`);
        await new Promise((resolve) => setTimeout(resolve, ms));
        order.push(`${name}:end`);
        return name;
      });

    const results = await Promise.all([task("a", 20), task("b", 1), task("c", 5)]);
    expect(results).toEqual(["a", "b", "c"]);
    expect(order).toEqual(["a:start", "a:end", "b:start", "b:end", "c:start", "c:end"]);
  });

  it("releases the lock when a task throws", async () => {
    const lock = new AsyncLock();
    await expect(lock.run(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    await expect(lock.run(async () => "next")).resolves.toBe("next");
  });
});
