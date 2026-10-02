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
