"use client";

// Client: role switcher. Radix Tabs gives the keyboard and screen-reader behaviour (arrow keys,
// tab/tabpanel roles). The active pill and the panel entrance are CSS transitions (no animation
// library in the page's first load); the global reduced-motion rule makes them instant.
// The mini screens of the tabs that aren't open at first load on demand (next/dynamic), so they
// cost nothing until a visitor picks that tab.
import dynamic from "next/dynamic";
import { Tabs } from "radix-ui";
import type { ReactNode } from "react";

/** Same size as the mini screens, so opening a tab doesn't shift the page while one loads. */
function PreviewPlaceholder() {
  return <div aria-hidden="true" className="mx-auto h-[30rem] w-full max-w-[21rem] animate-pulse rounded-[2.75rem] bg-muted" />;
}

const LAZY_PREVIEWS = {
  courier: dynamic(() => import("./illustrations/role-previews").then((m) => m.CourierPreview), { loading: PreviewPlaceholder }),
  admin: dynamic(() => import("./illustrations/role-previews").then((m) => m.AdminPreview), { loading: PreviewPlaceholder }),
};

export interface RoleTab {
  id: string;
  label: string;
  title: string;
  points: string[];
  /** The framed mini screen: a server-rendered node, or the key of one loaded on demand. */
  preview: ReactNode | { lazy: keyof typeof LAZY_PREVIEWS };
}

function Preview({ preview }: { preview: RoleTab["preview"] }) {
  if (preview && typeof preview === "object" && "lazy" in preview) {
    const Lazy = LAZY_PREVIEWS[preview.lazy];
    return <Lazy />;
  }
  return <>{preview}</>;
}

export function RoleTabs({ roles }: { roles: RoleTab[] }) {
  return (
    <Tabs.Root defaultValue={roles[0]?.id} className="space-y-6">
      <Tabs.List aria-label="Choose a role" className="inline-flex flex-wrap gap-1 rounded-full bg-secondary p-1">
        {roles.map((role) => (
          <Tabs.Trigger
            key={role.id}
            value={role.id}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted-foreground outline-none transition-[background-color,color,box-shadow] duration-300 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground data-[state=active]:shadow-card"
          >
            {role.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {roles.map((role) => (
        <Tabs.Content
          key={role.id}
          value={role.id}
          className="grid animate-in items-center gap-8 rounded-2xl bg-card p-6 shadow-card outline-none fade-in-0 slide-in-from-bottom-2 duration-300 focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12"
        >
          <div className="space-y-6">
            <h3 className="font-display text-2xl tracking-tight sm:text-3xl">{role.title}</h3>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {role.points.map((point) => (
                <li key={point} className="flex gap-3 rounded-xl bg-surface p-4 text-sm font-medium">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <Preview preview={role.preview} />
          </div>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
