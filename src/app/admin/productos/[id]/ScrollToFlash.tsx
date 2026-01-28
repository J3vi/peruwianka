"use client";

import { useEffect } from "react";

export default function ScrollToFlash({ id = "flash-msg" }: { id?: string }) {
  useEffect(() => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [id]);

  return null;
}
