import { PackageX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/** Unknown id, or a shipment assigned to another courier (the API answers 404 for both). */
export default function TaskNotFound() {
  return (
    <EmptyState
      icon={PackageX}
      title="This task isn't yours"
      description="It doesn't exist, or it's assigned to another courier."
      action={
        <Button asChild>
          <Link href="/courier">See your active tasks</Link>
        </Button>
      }
    />
  );
}
