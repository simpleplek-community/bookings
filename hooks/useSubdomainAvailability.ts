"use client";

import { useEffect, useState } from "react";
import { isSubdomainTaken, suggestSubdomains, validateSubdomain } from "../utils/subdomain";

export type AvailabilityStatus = "unchanged" | "invalid" | "checking" | "available" | "taken";

type CheckResult = { value: string; taken: boolean };

export function useSubdomainAvailability(value: string, current: string) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const error = validateSubdomain(value);
  const isUnchanged = value === current;

  useEffect(() => {
    if (isUnchanged || error) return;
    const timer = setTimeout(() => {
      setResult({ value, taken: isSubdomainTaken(value) });
    }, 450);
    return () => clearTimeout(timer);
  }, [value, isUnchanged, error]);

  let status: AvailabilityStatus;
  if (isUnchanged) status = "unchanged";
  else if (error) status = "invalid";
  else if (!result || result.value !== value) status = "checking";
  else status = result.taken ? "taken" : "available";

  const suggestions = status === "taken" ? suggestSubdomains(value) : [];

  return { status, error, suggestions };
}
