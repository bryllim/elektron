"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

/** The muted preview opens on the wind-turbine shot (same frame as the poster) instead of the white title card. */
const PREVIEW_START = 38.5;
const CHAPTERS: [string, number][] = [["The drop", 15], ["Muse", 53], ["3D twin", 66], ["What-if", 81], ["Typhoon", 101], ["Handover", 121]];

/** The launch film as the hero: muted autoplay while visible, chapter chips seek, sound on demand. */
export default function StoryHero() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [time, setTime] = useState(0);
  const [preference, setPreference] = useState<"auto" | "play" | "pause">("auto");
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    // metadata can load before hydration attaches onLoadedMetadata, so also seek here
    if (element.readyState >= 1 && element.currentTime < 1) element.currentTime = PREVIEW_START;
    let visible = false;
    const update = () => {
      if (visible && !document.hidden && !document.querySelector(".story-film-dialog[open]") && preference !== "pause" && (preference === "play" || !motion.matches)) {
        void element.play().catch(() => setPlaying(false));
      } else element.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && entry.intersectionRatio >= 0.2; update(); }, { threshold: [0, 0.2] });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    document.addEventListener("toggle", update, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      document.removeEventListener("toggle", update, true);
      element.pause();
    };
  }, [preference]);
  const chapter = CHAPTERS.reduce((current, [, start], index) => (time >= start ? index : current), -1);
  return (
    <figure className="story-hero-visual">
      <div className="story-film-frame">
        <video ref={video} muted={muted} loop playsInline preload="metadata" poster="/story/v4/film-poster.webp"
          onLoadedMetadata={(event) => { if (event.currentTarget.currentTime < 1) event.currentTarget.currentTime = PREVIEW_START; }}
          onTimeUpdate={() => setTime(video.current?.currentTime ?? 0)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
          aria-label="Elektron launch film: an inverter output drop, the Muse investigation, the 3D twin, a what-if test, a typhoon replay and the shift handover">
          <source src="/story/elektron-film.mp4" type="video/mp4" />
        </video>
        <div className="story-film-controls">
          <button type="button" aria-label={muted ? "Turn sound on" : "Mute"} onClick={() => {
            const element = video.current; if (!element) return;
            element.muted = !muted; setMuted(!muted);
            if (muted) { setPreference("play"); void element.play().catch(() => setPlaying(false)); }
          }}>{muted ? <VolumeX size={16} strokeWidth={1.5} /> : <Volume2 size={16} strokeWidth={1.5} />}</button>
          <button type="button" aria-label={playing ? "Pause film" : "Play film"} onClick={() => {
            if (playing) { setPreference("pause"); video.current?.pause(); }
            else { setPreference("play"); void video.current?.play().catch(() => setPlaying(false)); }
          }}>{playing ? <Pause size={16} strokeWidth={1.5} fill="currentColor" /> : <Play size={16} strokeWidth={1.5} fill="currentColor" />}</button>
        </div>
        <div className="story-film-progress" aria-hidden="true"><i style={{ width: `${(time / 142) * 100}%` }} /></div>
      </div>
      <figcaption className="story-preview-footer">
        <div className="story-scene-picker" role="group" aria-label="Jump to a chapter of the film">
          {CHAPTERS.map(([label, start], index) => <button key={label} type="button" aria-pressed={chapter === index} onClick={() => {
            const element = video.current; if (!element) return;
            element.currentTime = start; setTime(start); setPreference("play");
            void element.play().catch(() => setPlaying(false));
          }}>{label}</button>)}
        </div>
      </figcaption>
    </figure>
  );
}
