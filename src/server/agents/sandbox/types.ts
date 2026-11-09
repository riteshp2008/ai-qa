export type CommandOutcome = {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

export type RunOptions = {
  cwd?: string;
  timeoutMs?: number;
  envs?: Record<string, string>;
};

/**
 * A live, isolated machine the agents work in. Implementations must never
 * throw for non-zero exit codes: agents learn from failures.
 */
export interface SandboxSession {
  readonly id: string;
  /** Absolute path of the cloned repository inside the sandbox. */
  readonly repoDir: string;
  run(command: string, options?: RunOptions): Promise<CommandOutcome>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  /** Keeps the sandbox alive for at least `ms` more milliseconds. */
  extend(ms: number): Promise<void>;
  kill(): Promise<void>;
}

export interface SandboxProvider {
  readonly name: string;
  create(options: { metadata: Record<string, string> }): Promise<SandboxSession>;
  connect(id: string): Promise<SandboxSession>;
  kill(id: string): Promise<void>;
}
