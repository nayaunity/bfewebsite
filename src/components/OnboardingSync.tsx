"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function OnboardingSync() {
  const searchParams = useSearchParams();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (searchParams.get("onboarding") !== "complete") return;
    if (synced) return;

    const raw = sessionStorage.getItem("onboarding_data");
    if (!raw) return;

    try {
      const data = JSON.parse(raw);

      // Map wizard answers to profile fields
      const profileUpdate: Record<string, unknown> = {};

      // Target role — first selected role
      if (data.roles?.length > 0) {
        profileUpdate.targetRole = data.roles[0];
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

      // Location → city
      if (data.locations?.length > 0) {
        const loc = data.locations[0];
        if (loc !== "Remote US") {
          profileUpdate.city = loc;
        }
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
