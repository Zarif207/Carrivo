import type { Currency, DecimalString, ISODateString, Id, ListQuery, Money, ZoneRef } from "./common";
import type { ServiceType } from "./enums";

/* ── Zones ── */

export interface Zone {
  id: Id;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type ZoneSortBy = "name" | "code" | "createdAt";

/** `isActive` defaults to "true" on the API; "all" includes inactive zones. */
export type ZoneListQuery = ListQuery<ZoneSortBy> & {
  isActive?: "true" | "false" | "all";
};

export type CreateZoneInput = {
  name: string;
  /** 2-20 chars, letters/digits/dashes; stored upper-cased. */
  code: string;
  description?: string | null;
  isActive?: boolean;
};

export type UpdateZoneInput = Partial<CreateZoneInput>;

/* ── Hubs ── */

export interface Hub {
  id: Id;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string | null;
  isActive: boolean;
  zone: ZoneRef;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type HubSortBy = "name" | "code" | "city" | "createdAt";

export type HubListQuery = ListQuery<HubSortBy> & {
  zoneId?: Id;
  city?: string;
  isActive?: "true" | "false" | "all";
};

export type CreateHubInput = {
  name: string;
  /** 2-30 chars, letters/digits/dashes; stored upper-cased. */
  code: string;
  address: string;
  city: string;
  phone?: string | null;
  zoneId: Id;
  isActive?: boolean;
};

export type UpdateHubInput = Partial<CreateHubInput>;

/* ── Pricing ── */

export interface PricingRule {
  id: Id;
  name: string;
  serviceType: ServiceType;
  /** Both null = the service's default rule. */
  originZone: ZoneRef | null;
  destinationZone: ZoneRef | null;
  baseFee: Money;
  baseWeightLb: DecimalString;
  perLbFee: Money;
  /** null = no weight cap. */
  maxWeightLb: DecimalString | null;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type PricingSortBy = "name" | "serviceType" | "baseFee" | "perLbFee" | "createdAt";

export type PricingListQuery = ListQuery<PricingSortBy> & {
  serviceType?: ServiceType;
  originZoneId?: Id;
  destinationZoneId?: Id;
  /** Omit for both. */
  isActive?: "true" | "false";
};

/** Set both zone ids (route rule) or neither (default rule). Money/weights are numbers on input. */
export type CreatePricingRuleInput = {
  name: string;
  serviceType: ServiceType;
  originZoneId?: Id | null;
  destinationZoneId?: Id | null;
  baseFee: number;
  /** Default 1. */
  baseWeightLb?: number;
  perLbFee: number;
  /** Default null (no cap); must be ≥ baseWeightLb. */
  maxWeightLb?: number | null;
  /** Default true. Only one active rule per service + route. */
  isActive?: boolean;
};

export type UpdatePricingRuleInput = Partial<CreatePricingRuleInput>;

/** POST /pricing/estimate (public). */
export type PriceEstimateInput = {
  weightLb: number;
  serviceType: ServiceType;
  originZoneId: Id;
  destinationZoneId: Id;
};

/** total = baseFee + ceil(max(0, weight - baseWeightLb)) × perLbFee. All values are strings. */
export interface PriceEstimate {
  currency: Currency;
  weightLb: DecimalString;
  baseWeightLb: DecimalString;
  chargeableExtraLb: DecimalString;
  baseFee: Money;
  perLbFee: Money;
  weightCharge: Money;
  total: Money;
  serviceType: ServiceType;
}

/** Price snapshot stored on a shipment. */
export interface PriceBreakdown extends PriceEstimate {
  ruleName: string;
  calculatedAt: ISODateString;
}
