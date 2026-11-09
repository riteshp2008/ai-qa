import { Badge, type BadgeTone } from "@/components/ui/badge";
import { statusLabels } from "@/domain/pipelines/lifecycle";
import type { PipelineStatus } from "@/domain/pipelines/types";

const tones: Record<PipelineStatus, BadgeTone> = {
  queued: "neutral",
  provisioning: "info",
  analyzing: "info",
  containerizing: "info",
  awaiting_input: "warning",
  generating: "info",
  verifying: "info",
  awaiting_approval: "warning",
  creating_pr: "info",
  completed: "success",
  failed: "danger",
  rejected: "neutral",
  cancelled: "neutral",
};

export function PipelineStatusBadge({ status }: { status: PipelineStatus }) {
  return <Badge tone={tones[status]} dot>{statusLabels[status]}</Badge>;
}
