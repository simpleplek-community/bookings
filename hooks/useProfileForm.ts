"use client";

import { useState, useEffect } from "react";
import { useSubdomainAvailability } from "./useSubdomainAvailability";

export type SaveState = "idle" | "saving" | "saved" | "error";

export type HostProfile = {
  subdomain: string;
  displayName: string;
  bio: string;
};

export const BIO_MAX = 160;

export function useProfileForm(
  initialProfile: HostProfile,
  onSave?: (profile: HostProfile) => Promise<boolean>
) {
  const [profile, setProfile] = useState<HostProfile>(initialProfile);
  const [draft, setDraft] = useState<HostProfile>(initialProfile);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setProfile(initialProfile);
    setDraft(initialProfile);
  }, [initialProfile.subdomain, initialProfile.displayName, initialProfile.bio]);

  const availability = useSubdomainAvailability(draft.subdomain, profile.subdomain);
  const addressChanged = draft.subdomain !== profile.subdomain;
  const isDirty =
    addressChanged ||
    draft.displayName.trim() !== profile.displayName.trim() ||
    draft.bio.trim() !== profile.bio.trim();

  const nameError = draft.displayName.trim() ? null : "Add a name guests will recognise.";
  const addressOk =
    draft.subdomain === "" ||
    availability.status === "unchanged" ||
    availability.status === "available";
  const canSave = isDirty && !nameError && addressOk && saveState !== "saving";

  function setField<K extends keyof HostProfile>(key: K, value: HostProfile[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaveState("idle");
    setErrorMessage(null);
  }

  async function commit() {
    setConfirmOpen(false);
    setSaveState("saving");
    setErrorMessage(null);

    const next: HostProfile = {
      subdomain: draft.subdomain,
      displayName: draft.displayName.trim(),
      bio: draft.bio.trim(),
    };

    if (onSave) {
      const ok = await onSave(next);
      if (ok) {
        setProfile(next);
        setDraft(next);
        setSaveState("saved");
      } else {
        setSaveState("error");
      }
    } else {
      setProfile(next);
      setDraft(next);
      setSaveState("saved");
    }
  }

  function requestSave() {
    if (!canSave) return;
    if (addressChanged && profile.subdomain) {
      setConfirmOpen(true);
    } else {
      commit();
    }
  }

  function reset() {
    setDraft(profile);
    setSaveState("idle");
    setErrorMessage(null);
  }

  return {
    profile,
    draft,
    setField,
    availability,
    nameError,
    isDirty,
    canSave,
    saveState,
    errorMessage,
    setErrorMessage,
    confirmOpen,
    setConfirmOpen,
    requestSave,
    commit,
    reset,
  };
}
