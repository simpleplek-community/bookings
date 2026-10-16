export function formatRand(amount: number): string {
  return `R${Math.round(amount).toLocaleString("en-US")}`;
}

export function discountedTotal(base: number, nights: number, percent: number): number {
  return base * nights * (1 - percent / 100);
}

export function clampPercent(raw: string | number): number {
  const str = String(raw);
  const digits = str.replace(/\D/g, "").slice(0, 3);
  return digits ? Math.min(100, Number(digits)) : 0;
}

export type RuleOperator = "equals" | "greater" | "less" | "greater_or_equal" | "less_or_equal";

export const RULE_OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: "equals", label: "exactly" },
  { value: "greater", label: "more than" },
  { value: "less", label: "fewer than" },
  { value: "greater_or_equal", label: "at least" },
  { value: "less_or_equal", label: "at most" },
];

// ---------------------------------------------------------------------------
// Stay pricing. Shared by the booking UIs and the API routes so the total a
// guest sees is the total the server stores and charges.
// ---------------------------------------------------------------------------

export interface PricingRule {
  packageId?: string;
  packageIds?: string[];
  operator: RuleOperator;
  nights: number;
}

export interface PricingProperty {
  basePricePerNight: number;
  bookingType?: string;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  mandatoryRules?: PricingRule[];
}

export interface PricingPackage {
  id: string;
  price: number;
  category?: string;
  isPro?: boolean;
}

export interface StayQuote {
  isHourly: boolean;
  /** Nights for nightly stays; always 1 (one slot) for hourly bookings. */
  units: number;
  /** basePricePerNight × units, before discounts. */
  baseCost: number;
  discountKind: "weekly" | "monthly" | null;
  discountPercent: number;
  discountAmount: number;
  /** baseCost − discountAmount. */
  stayCost: number;
  packagePrice: number;
  /** stayCost + packagePrice, rounded to cents. */
  total: number;
}

const DAY_MS = 1000 * 60 * 60 * 24;

export function isHourlyProperty(property: Pick<PricingProperty, "bookingType"> | null | undefined): boolean {
  return property?.bookingType === "hourly";
}

export function isProPackage(pkg: Pick<PricingPackage, "isPro" | "category">): boolean {
  return Boolean(pkg.isPro || pkg.category === "pro");
}

export function isAddonPackage(pkg: Pick<PricingPackage, "category">): boolean {
  return pkg.category === "addon";
}

export function countNights(fromDate: Date | string, toDate: Date | string): number {
  const from = new Date(fromDate).getTime();
  const to = new Date(toDate).getTime();
  return Math.max(1, Math.ceil(Math.abs(to - from) / DAY_MS));
}

/** Billable units for a stay: nights, or a single slot for hourly properties. */
export function stayUnits(property: Pick<PricingProperty, "bookingType">, fromDate: Date | string, toDate: Date | string): number {
  return isHourlyProperty(property) ? 1 : countNights(fromDate, toDate);
}

function ruleMatches(rule: PricingRule, units: number): boolean {
  switch (rule.operator) {
    case "equals":
      return units === rule.nights;
    case "greater":
      return units > rule.nights;
    case "less":
      return units < rule.nights;
    case "greater_or_equal":
      return units >= rule.nights;
    case "less_or_equal":
      return units <= rule.nights;
    default:
      return false;
  }
}

/** Package ids the first matching mandatory rule requires for this stay length (empty when none applies). */
export function mandatoryPackageIdsFor(property: Pick<PricingProperty, "mandatoryRules"> | null | undefined, units: number): string[] {
  const rule = property?.mandatoryRules?.find((r) => ruleMatches(r, units));
  if (!rule) return [];
  if (Array.isArray(rule.packageIds) && rule.packageIds.length > 0) return rule.packageIds;
  return rule.packageId ? [rule.packageId] : [];
}

/** Mandatory package ids the user may actually book (Pro packages need a Pro user; unknown ids are kept). */
export function userAllowedMandatoryIds(mandatoryIds: string[], packages: PricingPackage[], isProUser: boolean): string[] {
  return mandatoryIds.filter((id) => {
    const pkg = packages.find((p) => p.id === id);
    return !pkg || !isProPackage(pkg) || isProUser;
  });
}

/**
 * The package a stay must be booked with. When a mandatory rule applies and the
 * requested package is not one the user may pick, the first allowed one is used,
 * matching the auto-selection in the booking UIs.
 */
export function resolveStayPackageId(
  property: Pick<PricingProperty, "mandatoryRules">,
  units: number,
  requestedPackageId: string | null | undefined,
  packages: PricingPackage[],
  isProUser: boolean
): string | null {
  const requested = requestedPackageId || null;
  const allowed = userAllowedMandatoryIds(mandatoryPackageIdsFor(property, units), packages, isProUser);
  if (allowed.length > 0 && (!requested || !allowed.includes(requested))) {
    return allowed[0];
  }
  return requested;
}

export function quoteStay(
  property: PricingProperty,
  fromDate: Date | string,
  toDate: Date | string,
  pkg?: Pick<PricingPackage, "price"> | null
): StayQuote {
  const isHourly = isHourlyProperty(property);
  const units = stayUnits(property, fromDate, toDate);
  const baseCost = (Number(property.basePricePerNight) || 0) * units;

  const weekly = Number(property.weeklyDiscount) || 0;
  const monthly = Number(property.monthlyDiscount) || 0;
  let discountKind: StayQuote["discountKind"] = null;
  let discountPercent = 0;
  if (!isHourly) {
    if (units >= 28 && monthly > 0) {
      discountKind = "monthly";
      discountPercent = monthly;
    } else if (units >= 7 && weekly > 0) {
      discountKind = "weekly";
      discountPercent = weekly;
    }
  }
  const discountAmount = baseCost * (discountPercent / 100);
  const stayCost = baseCost - discountAmount;
  const packagePrice = pkg ? Number(pkg.price) || 0 : 0;
  const total = Math.round((stayCost + packagePrice) * 100) / 100;

  return { isHourly, units, baseCost, discountKind, discountPercent, discountAmount, stayCost, packagePrice, total };
}
