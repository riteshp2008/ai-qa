import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <EmptyState
      icon={<AlertIcon />}
      title="Nothing here"
      description="This page doesn't exist, or you don't have access to it."
      action={<ButtonLink href="/dashboard">Go to your organization</ButtonLink>}
      className="py-24"
    />
  );
}
