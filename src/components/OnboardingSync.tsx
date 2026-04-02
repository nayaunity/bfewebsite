"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function OnboardingSync() {
  const searchParams = useSearchParams();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (searchParams.get("onboarding") !== "complete") return;
    if (synced) return;

    // Check both storage types — localStorage survives magic link auth (new tab)
    const raw = sessionStorage.getItem("onboarding_data") || localStorage.getItem("onboarding_data");
    if (!raw) return;

    try {
      const data = JSON.parse(raw);

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

      // Location → city + remotePreference
      if (data.locations?.length > 0) {
        const hasRemote = data.locations.includes("Remote US");
        const physicalLoc = data.locations.find((l: string) => l !== "Remote US");
        if (physicalLoc) {
          profileUpdate.city = physicalLoc;
        }
        if (hasRemote && physicalLoc) {
          profileUpdate.remotePreference = "Remote or Hybrid";
        } else if (hasRemote) {
          profileUpdate.remotePreference = "Remote";
        }
      }

      // Salary → salaryExpectation
      if (data.minSalary && data.minSalary > 0) {
        profileUpdate.salaryExpectation = `$${Number(data.minSalary).toLocaleString()}+`;
      }

      // Save to profile
      if (Object.keys(profileUpdate).length > 0) {
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
    } catch {}
  }, [searchParams, synced]);

  return null; // invisible component
}
