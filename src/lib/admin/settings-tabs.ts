/** Settings sections (plain module: the server page and the client tabs both read it). */
export const SETTINGS_TABS = [
  { value: "zones", label: "Zones" },
  { value: "hubs", label: "Hubs" },
  { value: "pricing", label: "Pricing rules" },
] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number]["value"];
