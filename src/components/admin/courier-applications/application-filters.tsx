"use client";

// Client: search and preferred-zone filter, written to the URL (the server re-renders the list).
import { X } from "lucide-react";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import { zoneOptions } from "@/lib/zones";
import type { Zone } from "@/types";

const ALL = "all";

export function ApplicationFilters({ zones }: { zones: Pick<Zone, "id" | "name">[] }) {
  const { get, set } = useUrlState();
  const zone = get("zoneId") ?? ALL;
  const active = zone !== ALL || Boolean(get("searchTerm"));
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <SearchInput label="Search applications" placeholder="Name, email or phone" className="md:max-w-sm" />
      <Select value={zone} onValueChange={(v) => set({ zoneId: v === ALL ? null : v, view: null })}>
        <SelectTrigger className="w-full md:w-56" aria-label="Filter by preferred zone">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any preferred zone</SelectItem>
          {zoneOptions(zones).map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {active ? (
        <Button variant="ghost" onClick={() => set({ zoneId: null, searchTerm: null, view: null })} className="self-start md:self-auto">
          <X aria-hidden="true" /> Clear
        </Button>
      ) : null}
    </div>
  );
}
