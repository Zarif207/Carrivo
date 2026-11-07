import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { RoleGate } from "@/components/auth/role-gate";
import { HubDialog } from "@/components/admin/settings/hub-dialog";
import { PricingDialog } from "@/components/admin/settings/pricing-dialog";
import { HubsTable, PricingTable, ZonesTable } from "@/components/admin/settings/settings-tables";
import { SettingsTabs } from "@/components/admin/settings/settings-tabs";
import { ZoneDialog } from "@/components/admin/settings/zone-dialog";
import { LoadError } from "@/components/shared/load-error";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { TableSkeleton, ToolbarSkeleton } from "@/components/shipments/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SETTINGS_TABS, type SettingsTab } from "@/lib/admin/settings-tabs";
import { ApiError } from "@/lib/api/errors";
import { listAdminHubs, listAdminZones, listPricingRules } from "@/lib/data/admin";
import { firstParam, parseListParams, pickEnum, type RawSearchParams } from "@/lib/list-params";
import type { HubSortBy, PricingSortBy, ZoneSortBy } from "@/types";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

const TABS = SETTINGS_TABS.map((t) => t.value);
const SORTS = {
  zones: ["name", "code", "createdAt"] as const satisfies readonly ZoneSortBy[],
  hubs: ["name", "code", "city", "createdAt"] as const satisfies readonly HubSortBy[],
  pricing: ["name", "serviceType", "baseFee", "perKgFee", "createdAt"] as const satisfies readonly PricingSortBy[],
};

const SEARCH_HINT: Record<SettingsTab, string> = { zones: "Name or code", hubs: "Name, code or city", pricing: "Rule name" };

function NewButton({ label }: { label: string }) {
  return (
    <Button>
      <Plus aria-hidden="true" /> {label}
    </Button>
  );
}

/** Active zones for the hub and pricing forms (one request, inactive included so edits keep their zone). */
const zoneOptions = async () => (await listAdminZones({ isActive: "all", limit: 100, sortBy: "name", sortOrder: "asc" })).data.map((z) => ({ id: z.id, name: z.name, isActive: z.isActive }));

type TabData =
  | { tab: "zones"; result: Awaited<ReturnType<typeof listAdminZones>> }
  | { tab: "hubs"; result: Awaited<ReturnType<typeof listAdminHubs>>; zones: Awaited<ReturnType<typeof zoneOptions>> }
  | { tab: "pricing"; result: Awaited<ReturnType<typeof listPricingRules>>; zones: Awaited<ReturnType<typeof zoneOptions>> };

/** Zones and hubs default to name A-Z; pricing to newest first. Inactive records are included. */
async function loadTab(tab: SettingsTab, params: RawSearchParams): Promise<TabData> {
  const order = (fallback: "asc" | "desc") => (firstParam(params.sortOrder) ? undefined : fallback);
  if (tab === "zones") {
    const q = parseListParams(params, { sortFields: SORTS.zones, defaultSort: "name", defaultLimit: 20 });
    return { tab, result: await listAdminZones({ ...q, sortOrder: order("asc") ?? q.sortOrder, isActive: "all" }) };
  }
  if (tab === "hubs") {
    const q = parseListParams(params, { sortFields: SORTS.hubs, defaultSort: "name", defaultLimit: 20 });
    const [result, zones] = await Promise.all([listAdminHubs({ ...q, sortOrder: order("asc") ?? q.sortOrder, isActive: "all" }), zoneOptions()]);
    return { tab, result, zones };
  }
  const q = parseListParams(params, { sortFields: SORTS.pricing, defaultSort: "createdAt", defaultLimit: 20 });
  const [result, zones] = await Promise.all([listPricingRules(q), zoneOptions()]);
  return { tab, result, zones };
}

const TAB_NAMES: Record<SettingsTab, string> = { zones: "Zones", hubs: "Hubs", pricing: "Pricing rules" };

async function TabContent({ tab, params }: { tab: SettingsTab; params: RawSearchParams }) {
  let data: TabData;
  try {
    data = await loadTab(tab, params);
  } catch (error) {
    unstable_rethrow(error);
    return <LoadError what={TAB_NAMES[tab]} message={ApiError.isApiError(error) ? error.message : undefined} />;
  }
  const filtered = Boolean(firstParam(params.searchTerm));
  const { meta } = data.result;
  switch (data.tab) {
    case "zones":
      return (
        <Section action={<ZoneDialog trigger={<NewButton label="New zone" />} />} hint={SEARCH_HINT.zones}>
          <ZonesTable rows={data.result.data} filtered={filtered} />
          <Pagination meta={meta} itemLabel={meta.total === 1 ? "zone" : "zones"} />
        </Section>
      );
    case "hubs":
      return (
        <Section action={<HubDialog zones={data.zones} trigger={<NewButton label="New hub" />} />} hint={SEARCH_HINT.hubs}>
          <HubsTable rows={data.result.data} zones={data.zones} filtered={filtered} />
          <Pagination meta={meta} itemLabel={meta.total === 1 ? "hub" : "hubs"} />
        </Section>
      );
    case "pricing":
      return (
        <Section action={<PricingDialog zones={data.zones} trigger={<NewButton label="New rule" />} />} hint={SEARCH_HINT.pricing}>
          <PricingTable rows={data.result.data} zones={data.zones} filtered={filtered} />
          <Pagination meta={meta} itemLabel={meta.total === 1 ? "rule" : "rules"} />
        </Section>
      );
  }
}

function Section({ action, hint, children }: { action: ReactNode; hint: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput label="Search" placeholder={hint} className="sm:max-w-sm" />
        <RoleGate allow="ADMIN">{action}</RoleGate>
      </div>
      {children}
    </div>
  );
}

async function Settings({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const tab: SettingsTab = pickEnum(firstParam(params.tab), TABS) ?? "zones";
  const key = JSON.stringify({ tab, ...params });
  return (
    <SettingsTabs active={tab}>
      <Suspense key={key} fallback={<TableSkeleton rows={6} />}>
        <TabContent tab={tab} params={params} />
      </Suspense>
    </SettingsTabs>
  );
}

export default function AdminSettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  return (
    <>
      <PageHeader title="Settings" description="Delivery zones, hubs and the pricing rules that quote every shipment." />
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-11 w-72 rounded-full" />
            <ToolbarSkeleton />
            <TableSkeleton rows={6} />
          </div>
        }
      >
        <Settings searchParams={searchParams} />
      </Suspense>
    </>
  );
}
