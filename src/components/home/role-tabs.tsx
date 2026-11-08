"use client";

// Client: role switcher. Radix Tabs gives the keyboard and screen-reader behaviour (arrow keys,
// tab/tabpanel roles); Framer Motion slides the active pill (layoutId) and fades the panel in.
// Under reduced motion MotionConfig drops the movement and keeps an instant switch.
import { LazyMotion, MotionConfig, m } from "motion/react";
import { Tabs } from "radix-ui";
import { useState } from "react";

const loadFeatures = () => import("./motion-features").then((mod) => mod.loadDomMax());

export interface RoleTab {
  id: string;
  label: string;
  title: string;
  points: string[];
}

export function RoleTabs({ roles }: { roles: RoleTab[] }) {
  const [value, setValue] = useState(roles[0]?.id ?? "");
  // The first panel is in the server HTML fully visible; only panels shown after a switch fade in.
  const [switched, setSwitched] = useState(false);

  return (
    <LazyMotion features={loadFeatures}>
      <MotionConfig reducedMotion="user">
        <Tabs.Root
          value={value}
          onValueChange={(next) => {
            setSwitched(true);
            setValue(next);
          }}
          className="space-y-6"
        >
          <Tabs.List aria-label="Choose a role" className="inline-flex flex-wrap gap-1 rounded-full bg-secondary p-1">
            {roles.map((role) => (
              <Tabs.Trigger
                key={role.id}
                value={role.id}
                className="relative rounded-full px-5 py-2.5 text-sm font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=active]:text-brand-foreground"
              >
                {role.id === value ? (
                  <m.span
                    layoutId="role-pill"
                    className="absolute inset-0 -z-0 rounded-full bg-brand shadow-card"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <span className="relative">{role.label}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {roles.map((role) => (
            <Tabs.Content key={role.id} value={role.id} className="rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <m.div
                initial={switched ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.2, 0.7, 0.1, 1] }}
                className="grid gap-6 rounded-2xl bg-card p-6 shadow-card sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10"
              >
                <h3 className="font-display text-2xl tracking-tight sm:text-3xl">{role.title}</h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {role.points.map((point) => (
                    <li key={point} className="flex gap-3 rounded-xl bg-surface p-4 text-sm font-medium">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </m.div>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </MotionConfig>
    </LazyMotion>
  );
}
