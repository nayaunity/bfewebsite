"use client";

import { useEffect, useState } from "react";
import { workshopRegistrationOpen } from "./EventCountdown";

/**
 * Wraps a workshop purchase button. Once the live session has started,
 * registration is no longer offered: the button is replaced with a short
 * notice that points back to the plugin, which stays on sale.
 */
export default function WorkshopCta({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(() => workshopRegistrationOpen());

  useEffect(() => {
    const tick = () => setOpen(workshopRegistrationOpen());
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  if (open) return <>{children}</>;

  return (
    <p className={`text-sm leading-relaxed ${dark ? "text-white/80" : "text-[var(--gray-600)]"}`}>
      Registration for the live workshop closed when the session started.{" "}
      <a
        href="#choose-your-option"
        className={`font-medium underline underline-offset-4 ${dark ? "text-white" : "text-[var(--accent)]"}`}
      >
        The plugin is still available.
      </a>
    </p>
  );
}
