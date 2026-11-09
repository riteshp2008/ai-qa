"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import type { Artifact, ArtifactKind } from "@/domain/pipelines/types";
import { cn } from "@/lib/utils/cn";

const kindLabels: Record<ArtifactKind, string> = { dockerfile: "Docker", e2e: "E2E", api: "API", unit: "Unit", config: "Config", dependency: "Deps" };

/** File browser for generated artifacts: list on the left, read-only source on the right. */
export default function ArtifactViewer({ artifacts }: { artifacts: Artifact[] }) {
  const [selectedPath, setSelectedPath] = useState(() => artifacts.find((artifact) => artifact.kind !== "dependency")?.path ?? artifacts[0]?.path);
  const selected = useMemo(() => artifacts.find((artifact) => artifact.path === selectedPath), [artifacts, selectedPath]);
  const lines = useMemo(() => selected?.content.split("\n") ?? [], [selected]);

  if (artifacts.length === 0) return <p className="px-5 py-6 text-sm text-muted">No files yet.</p>;

  return (
    <div className="grid min-h-80 lg:grid-cols-[240px_minmax(0,1fr)]">
      <ul className="max-h-48 overflow-y-auto border-b border-line p-2 lg:max-h-[560px] lg:border-b-0 lg:border-r" role="listbox" aria-label="Generated files">
        {artifacts.map((artifact) => (
          <li key={artifact.id}>
            <button
              type="button"
              role="option"
              aria-selected={artifact.path === selectedPath}
              onClick={() => setSelectedPath(artifact.path)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-mono text-xs transition",
                artifact.path === selectedPath ? "bg-surface-sunken text-ink" : "text-muted hover:bg-surface-muted hover:text-ink",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{artifact.path}</span>
              <Badge className="text-[10px]">{kindLabels[artifact.kind]}</Badge>
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
            <p className="truncate font-mono text-xs text-muted">{selected.path} · {lines.length} lines</p>
            <CopyButton value={selected.content} />
          </div>
          <pre className="max-h-[520px] overflow-auto bg-surface-muted/50 py-3 text-xs leading-relaxed">
            <code className="grid">
              {lines.map((line, index) => (
                <span key={index} className="grid grid-cols-[3rem_minmax(0,1fr)] px-2 hover:bg-surface-sunken/60">
                  <span className="select-none pr-3 text-right text-subtle">{index + 1}</span>
                  <span className="whitespace-pre">{line || " "}</span>
                </span>
              ))}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}
