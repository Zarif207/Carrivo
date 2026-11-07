import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatCardSkeleton } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Greeting } from "./greeting";

interface AreaHomeProps {
  title: string;
  description: string;
  icon: LucideIcon;
  /** What this area will show once its phase is built. */
  upcoming: string;
  action?: { href: string; label: string };
}

/** Temporary landing page for each role until its real dashboard is built. */
export function AreaHome({ title, description, icon: Icon, upcoming, action }: AreaHomeProps) {
  return (
    <>
      <PageHeader
        title={<Greeting fallback={title} />}
        description={description}
        actions={
          action ? (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : null
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="mt-6 flex items-start gap-4 rounded-xl bg-card p-6 shadow-card">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-muted-foreground">{upcoming}</p>
        </div>
      </div>
    </>
  );
}
