"use client";

// DEPRECATED — used only by the legacy 25-step wizard at /auto-apply/get-started?legacy=1.
// The resume-first /start flow does its TempOnboarding -> User promotion server-side via
// /api/onboarding/promote (called after signup). Keep this mounted for legacy users
// already mid-flow during the 2-week cutover; delete after we're confident nobody's
// still in the legacy flow.

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function OnboardingSync() {
  const searchParams = useSearchParams();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (searchParams.get("onboarding") !== "complete") return;
    if (synced) return;

    async function loadAndSync() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = null;

      // Try DB-based retrieval first (survives device/tab switches)
      const tempId = searchParams.get("tempId");
      if (tempId) {
        try {
          const res = await fetch(`/api/onboarding/temp-save?tempId=${tempId}`);
          if (res.ok) {
            const json = await res.json();
            data = json.data;
          }
        } catch {}
      }

      // Fallback to localStorage/sessionStorage
      if (!data) {
        const raw = sessionStorage.getItem("onboarding_data") || localStorage.getItem("onboarding_data");
        if (!raw) return;
        try { data = JSON.parse(raw); } catch { return; }
      }

      if (!data) return;

      // Map wizard answers to profile fields
      const profileUpdate: Record<string, unknown> = {};

      // Target roles — save all selected roles as JSON array
      if (data.roles?.length > 0) {
        profileUpdate.targetRole = JSON.stringify(data.roles);
      }

      // Experience → yearsOfExperience
      if (data.experience?.length > 0) {
        const expMap: Record<string, string> = {
          "Internship": "0",
          "Entry Level & Graduate": "1",
          "Junior (1-2 years)": "2",
          "Mid Level (3-5 years)": "4",
          "Senior (6-9 years)": "7",
          "Expert & Leadership (10+ years)": "10",
        };
        profileUpdate.yearsOfExperience = expMap[data.experience[0]] || "5";
      }

      // Location → workLocations + remotePreference
      // NOTE: `data.locations` is the wizard's "Where do you want to work?"
      // answer — preferred *work* cities, not residence. Never write it to
      // the `city` profile field (which is residence). User sets `city`
      // themselves on /profile via LocationSection.
      if (data.locations?.length > 0) {
        const hasRemote = data.locations.includes("Remote US");
        const workLocs = data.locations.filter((l: string) => l !== "Remote US");
        if (workLocs.length > 0) {
          profileUpdate.workLocations = JSON.stringify(workLocs);
        }
        if (hasRemote && workLocs.length > 0) {
          profileUpdate.remotePreference = "Remote or Hybrid";
        } else if (hasRemote) {
          profileUpdate.remotePreference = "Remote";
        }
      }

      // Salary → salaryExpectation
      if (data.minSalary && data.minSalary > 0) {
        profileUpdate.salaryExpectation = `$${Number(data.minSalary).toLocaleString()}+`;
      }

      // Name
      if (data.firstName?.trim()) {
        profileUpdate.firstName = data.firstName.trim();
      }
      if (data.lastName?.trim()) {
        profileUpdate.lastName = data.lastName.trim();
      }

      // Phone
      if (data.phone?.trim()) {
        profileUpdate.phone = data.phone.trim();
      }

      // LinkedIn
      if (data.linkedinUrl?.trim()) {
        profileUpdate.linkedinUrl = data.linkedinUrl.trim();
      }

      // Country + State
      if (data.countryOfResidence?.trim()) {
        profileUpdate.countryOfResidence = data.countryOfResidence.trim();
      }
      if (data.usState?.trim()) {
        profileUpdate.usState = data.usState.trim();
      }

      // Work authorization
      if (data.workAuthorized === "Yes" || data.workAuthorized === "No") {
        profileUpdate.workAuthorized = data.workAuthorized === "Yes";
      }
      if (data.needsSponsorship === "Yes" || data.needsSponsorship === "No") {
        profileUpdate.needsSponsorship = data.needsSponsorship === "Yes";
      }

      // Save to profile + mark onboarding complete. autoApplyEnabled is the
      // product promise; flip it on here as defense-in-depth in addition to
      // the POST /api/profile/onboarding call below.
      if (Object.keys(profileUpdate).length > 0) {
        profileUpdate.onboardingCompletedAt = new Date().toISOString();
        profileUpdate.autoApplyEnabled = true;
        fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileUpdate),
        }).then((res) => {
          if (res.ok) {
            sessionStorage.removeItem("onboarding_data");
            localStorage.removeItem("onboarding_data");
            setSynced(true);
            // Clean URL without reload
            window.history.replaceState({}, "", window.location.pathname);
          }
        });
      }

      // Also save full wizard data for analytics/future use
      fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => {}); // fire and forget
    }

    loadAndSync();
  }, [searchParams, synced]);

  return null; // invisible component
}
