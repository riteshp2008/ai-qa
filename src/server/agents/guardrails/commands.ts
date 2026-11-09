import type { AgentName } from "@/domain/pipelines/types";

export type CommandCheck = { ok: true } | { ok: false; reason: string };

/**
 * Commands no agent may run. The sandbox is already isolated; these rules stop
 * agents from exfiltrating secrets, pushing code, escaping the container
 * boundary, or wrecking the workspace mid-run.
 */
const blocked: Array<[RegExp, string]> = [
  [/\bgit\s+(push|remote|config\s+--global|credential)/i, "Agents cannot push or change git remotes; the platform opens the PR."],
  [/(^|[;&|(]\s*)(sudo\s+)?(printenv|env|export\s+-p|set)(\s*$|\s*[;&|)])/, "Reading the environment is not allowed."],
  [/\b(cat|less|more|head|tail|grep|sed|awk|cp|mv|base64|xxd|od)\b[^\n;|&]*(^|[\s/])\.env(\.[\w-]+)?\b/, "Reading .env files is not allowed."],
  [/\/proc\/[^\s]*\/environ|\/proc\/self/i, "Reading process environment is not allowed."],
  [/\.git-credentials|\.ssh\/|\.aws\/|\.config\/gh|\.sentinel\//i, "Credential stores are off limits."],
  [/\brm\s+-[a-z]*r[a-z]*f?\s+(\/|~|\$HOME|\*)(\s|$)/i, "Destructive recursive delete is not allowed."],
  [/\b(mkfs|shutdown|reboot|halt|poweroff|dd\s+if=)\b/i, "System-level commands are not allowed."],
  [/:\(\)\s*\{\s*:\|:&\s*\};:/, "Fork bombs are not allowed."],
  [/\b(nc|ncat|netcat|ssh|scp|sftp|telnet)\b/i, "Raw network tools are not allowed."],
  [/docker\s+run[^\n]*(--privileged|-v\s+\/:|--volume[= ]\/:|--pid[= ]host|--network[= ]host)/i, "Privileged or host-mounted containers are not allowed."],
  [/\bcurl\b[^|\n]*\|\s*(sudo\s+)?(ba|z)?sh\b|\bwget\b[^|\n]*\|\s*(sudo\s+)?(ba|z)?sh\b/i, "Piping downloads into a shell is not allowed."],
  [/\b(crontab|systemctl|service)\b/i, "Service management is not allowed."],
];

/** Docker is only for the containerizer; test agents interact with the running app over HTTP. */
const dockerOnly: AgentName[] = ["containerizer"];

export function checkCommand(agent: AgentName, command: string): CommandCheck {
  const trimmed = command.trim();
  if (!trimmed) return { ok: false, reason: "Empty command." };
  if (trimmed.length > 4000) return { ok: false, reason: "Command is too long." };
  for (const [pattern, reason] of blocked) {
    if (pattern.test(trimmed)) return { ok: false, reason };
  }
  if (/\bdocker\b/.test(trimmed) && !dockerOnly.includes(agent)) {
    return { ok: false, reason: "Only the containerizer agent may run docker commands." };
  }
  return { ok: true };
}

/** Dependency installs mutate shared manifests; the runtime serializes them across parallel agents. */
export function isDependencyInstall(command: string) {
  return /\b(npm\s+(i|install|ci|add)|pnpm\s+(i|install|add)|yarn(\s+add|\s+install)?|bun\s+(i|install|add)|pip3?\s+install|poetry\s+add|go\s+get)\b/.test(command)
    || /\bnpx\s+playwright\s+install\b/.test(command);
}
