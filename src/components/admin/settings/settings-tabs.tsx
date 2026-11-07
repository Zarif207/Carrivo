"use client";

// Client: tabs synced to ?tab= (the server renders only the active tab's list).
import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlState } from "@/hooks/use-url-state";
import { SETTINGS_TABS, type SettingsTab } from "@/lib/admin/settings-tabs";


export function SettingsTabs({ active, children }: { active: SettingsTab; children: ReactNode }) {
  const { set } = useUrlState();
  return (
    <Tabs value={active} onValueChange={(tab) => set({ tab: tab === "zones" ? null : tab, searchTerm: null, sortBy: null, sortOrder: null })}>
      <TabsList aria-label="Settings sections">
        {SETTINGS_TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={active} className="mt-6">
        {children}
      </TabsContent>
    </Tabs>
  );
}
