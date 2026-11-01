"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export default function StoryHero() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [preference, setPreference] = useState<"auto" | "play" | "pause">("auto");
  const [scene, setScene] = useState(0);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => {
      if (visible && !document.hidden && !document.querySelector(".story-film-dialog[open]") && preference !== "pause" && (preference === "play" || !motion.matches)) {
        void element.play().catch(() => setPlaying(false));
      } else element.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.1;
      update();
    }, { threshold: 0.1 });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    document.addEventListener("toggle", update, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
      document.removeEventListener("toggle", update, true);
      element.pause();
    };
  }, [preference]);
  return (
    <figure className="story-hero-visual">
      <div className="story-film-frame">
        <video ref={video} muted loop playsInline preload="none" poster="/story/plant-preview.webp"
          onTimeUpdate={() => setScene(Math.min(2, Math.floor((video.current?.currentTime ?? 0) / 3)))}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
          aria-label="Rendered views of Elektron’s solar, wind and geothermal digital twins">
          <source src="/story/plant-preview.mp4" type="video/mp4" />
        </video>
        <button className="story-film-toggle" type="button" aria-label={playing ? "Pause plant preview" : "Play plant preview"}
          onClick={() => {
            if (playing) { setPreference("pause"); video.current?.pause(); }
            else { setPreference("play"); void video.current?.play().catch(() => setPlaying(false)); }
          }}>
          {playing ? <Pause size={16} strokeWidth={1.5} fill="currentColor" /> : <Play size={16} strokeWidth={1.5} fill="currentColor" />}
        </button>
      </div>
      <figcaption className="story-preview-footer">
        <div className="story-scene-picker" role="group" aria-label="Preview a plant type">
          {["Solar", "Wind", "Geothermal"].map((label, index) => <button key={label} type="button" aria-pressed={scene === index} onClick={() => {
            if (video.current) video.current.currentTime = index * 3 + 0.05;
            setScene(index);
            setPreference("play");
            void video.current?.play().catch(() => setPlaying(false));
          }}>{label}</button>)}
        </div>
        <span>Solar, wind and geothermal digital twins</span>
      </figcaption>
    </figure>
  );
}
