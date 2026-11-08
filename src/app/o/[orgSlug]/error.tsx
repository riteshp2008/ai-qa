"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertIcon } from "@/components/ui/icons";

export default function OrganizationError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon={<AlertIcon />}
      title="Something went wrong"
      description="We couldn't load this page. It may be a temporary problem."
      action={<Button onClick={reset}>Try again</Button>}
      className="py-24"
    />
  );
}
