"use client";

import { useEffect, useState } from "react";

/** Stable for prerender/SSR; refreshed on the client after mount. */
const PRERENDER_YEAR = 2026;

export function CopyrightYear() {
  const [year, setYear] = useState(PRERENDER_YEAR);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return year;
}
