"use client";
import { useEffect } from "react";

const ease = (x: number) => 1 - Math.pow(1 - x, 4);

/** Count [data-count] up (or from [data-from]) once, keeping the written decimals and a true minus sign. */
function countUp(element: HTMLElement) {
  const raw = element.dataset.count ?? "0";
  const to = Number(raw), from = Number(element.dataset.from ?? 0);
  const decimals = (raw.split(".")[1] ?? "").length;
  const start = performance.now(), duration = 1400;
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration), value = from + (to - from) * ease(p);
    element.textContent = value.toFixed(decimals).replace("-", "−");
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Dismiss the mobile navigation, and play each block's scroll effect once it comes into view. */
export default function StoryMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".project-story");
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
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (root && !reduced) {
      root.classList.add("story-motion");
      root.querySelectorAll<HTMLElement>("[data-stagger]").forEach((group) => {
        Array.from(group.children).forEach((child, i) => (child as HTMLElement).style.setProperty("--i", String(i)));
      });
    }
    // A fully clip-path-ed element never intersects, so clip/wipe blocks are watched through their parent.
    const watched = new Map<Element, Element[]>();
    const reveal = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        for (const target of watched.get(entry.target) ?? []) {
          if (entry.isIntersecting) {
            if (target.classList.contains("is-in")) continue;
            target.classList.add("is-in");
            if (!reduced) target.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
          } else if (entry.boundingClientRect.top > 0) target.classList.remove("is-in"); // replay when it scrolls back in from below
        }
      }
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
    root?.querySelectorAll("[data-reveal]").forEach((element) => {
      const kind = element.getAttribute("data-reveal");
      const host = (kind === "clip" || kind === "wipe") && element.parentElement ? element.parentElement : element;
      watched.set(host, [...(watched.get(host) ?? []), element]);
      reveal.observe(host);
    });
    // Scroll-linked effects: every [data-scroll] element gets --p, its progress through the viewport (0 entering, 1 leaving),
    // and the page gets --scroll (0..1) for the progress bar. CSS turns these into parallax, drift, grow and spin.
    const linked = root ? Array.from(root.querySelectorAll<HTMLElement>("[data-scroll]")) : [];
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = innerHeight;
      for (const element of linked) {
        const box = element.getBoundingClientRect();
        if (box.bottom < -200 || box.top > vh + 200) continue;
        element.style.setProperty("--p", Math.min(1, Math.max(0, (vh - box.top) / (vh + box.height))).toFixed(4));
      }
      const max = document.documentElement.scrollHeight - vh;
      root?.style.setProperty("--scroll", (max > 0 ? scrollY / max : 0).toFixed(4));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    if (!reduced) { update(); addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); }
    document.addEventListener("click", dismissMenu);
    document.addEventListener("keydown", escape);
    return () => {
      reveal.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener("click", dismissMenu);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return null;
}
