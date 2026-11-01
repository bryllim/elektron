"use client";
import { useEffect } from "react";
/** Dismiss the mobile navigation while keeping its native keyboard behavior. */
export default function StoryMotion() {
  useEffect(() => {
    const root = document.querySelector(".project-story");
    const menu = root?.querySelector<HTMLDetailsElement>(".story-mobile-nav");
    const dismissMenu = (event: Event) => {
      const target = event.target;
      if (menu?.open && target instanceof Element && (target.closest("a") || !menu.contains(target))) menu.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu?.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("click", dismissMenu);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", dismissMenu);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return null;
}
