"use client";

// Client: search, role and status filters that write to the URL (the server re-renders the list).
import { X } from "lucide-react";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import { ROLE_META, USER_STATUS_META } from "@/lib/status";
import { ROLES, USER_STATUSES } from "@/types";

const ALL = "all";

export function UserFilters() {
  const { get, set } = useUrlState();
  const role = get("role") ?? ALL;
  const status = get("status") ?? ALL;
  const active = role !== ALL || status !== ALL || Boolean(get("searchTerm"));
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <SearchInput label="Search users" placeholder="Name, email or phone" className="md:max-w-sm" />
      <div className="grid grid-cols-2 gap-3 md:flex">
        <Select value={role} onValueChange={(v) => set({ role: v === ALL ? null : v, view: null })}>
          <SelectTrigger className="w-full md:w-40" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_META[r].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => set({ status: v === ALL ? null : v, view: null })}>
          <SelectTrigger className="w-full md:w-40" aria-label="Filter by account status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            {USER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {USER_STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {active ? (
        <Button variant="ghost" onClick={() => set({ role: null, status: null, searchTerm: null, view: null })} className="self-start md:self-auto">
          <X aria-hidden="true" /> Clear
        </Button>
      ) : null}
    </div>
  );
}
