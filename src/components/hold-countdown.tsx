"use client";

import { useEffect, useState } from "react";

export function HoldCountdown({ heldUntil }: { heldUntil: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function tick() {
      const ms = new Date(heldUntil).getTime() - Date.now();
      if (ms <= 0) {
        setLabel("Hold expired");
        return;
      }
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      setLabel(`${minutes}:${String(seconds).padStart(2, "0")} left to pay`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [heldUntil]);

  return <p className="text-sm font-semibold text-[#9b2335]">{label}</p>;
}
