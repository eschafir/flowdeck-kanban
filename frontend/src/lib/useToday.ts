import { useEffect, useState } from "react";
import { todayKey } from "./deadline";

/** Today's local date key; refreshes so an app left open overnight stays accurate. */
export function useToday(): string {
  const [today, setToday] = useState(() => todayKey());

  useEffect(() => {
    function refresh() {
      setToday(todayKey());
    }
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return today;
}
