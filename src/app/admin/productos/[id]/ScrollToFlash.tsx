"use client";

import { useEffect } from "react";

export default function ScrollToFlash({ id = "flash-msg" }: { id?: string }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return null;
}
