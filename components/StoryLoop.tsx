"use client";

import { useEffect, useRef } from "react";

/** Muted 3D render loop that only plays while on screen (and never with reduced motion). */
export default function StoryLoop({ src, poster, label }: { src: string; poster: string; label: string }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !motion.matches && !document.querySelector(".story-film-dialog[open]")) void element.play().catch(() => {});
      else element.pause();
    }, { threshold: 0.2 });
    observer.observe(element);
    return () => { observer.disconnect(); element.pause(); };
  }, []);
  return <video ref={video} className="story-loop" muted loop playsInline preload="none" poster={poster} aria-label={label}><source src={src} type="video/mp4" /></video>;
}
