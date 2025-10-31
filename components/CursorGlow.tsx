"use client";

import { useEffect } from "react";

export default function CursorGlow() {
  useEffect(() => {
    const container = document.querySelector(".cursor-glow-container");
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const glow = container as HTMLElement;
      glow.style.setProperty("--mouse-x", `${e.clientX}px`);
      glow.style.setProperty("--mouse-y", `${e.clientY}px`);
    };

    container.addEventListener("mousemove", handleMouseMove as EventListener);

    return () => {
      container.removeEventListener(
        "mousemove",
        handleMouseMove as EventListener
      );
    };
  }, []);

  return null;
}
