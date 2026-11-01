"use client";

import { useRef } from "react";
import { Play, X } from "lucide-react";

export default function StoryFilm() {
  const dialog = useRef<HTMLDialogElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function close() { player.current?.pause(); dialog.current?.close(); }
  return <>
    <button ref={trigger} className="story-watch-film" type="button" aria-haspopup="dialog" aria-controls="elektron-film" onClick={() => {
      dialog.current?.showModal();
      void player.current?.play().catch(() => {});
      dialog.current?.querySelector<HTMLButtonElement>(".story-film-close")?.focus({ preventScroll: true });
    }}><Play size={16} strokeWidth={1.5} fill="currentColor" />Watch the film <span>2 min</span></button>
    <dialog ref={dialog} id="elektron-film" className="story-film-dialog" aria-labelledby="film-title" onCancel={() => player.current?.pause()} onClose={() => {
      player.current?.pause();
      trigger.current?.focus({ preventScroll: true });
    }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
    }}>
      <div className="story-film-bar"><h2 id="film-title">ELEKTRON <span>The afternoon alarm</span></h2><button className="story-film-close" aria-label="Close film" onClick={close}><X size={16} strokeWidth={1.5} /></button></div>
      <video ref={player} controls playsInline preload="none" poster="/story/elektron-polished-poster.webp" aria-label="ELEKTRON: The afternoon alarm. A two-minute conversation from Bryl, Engr. William and Meta Muse, with animated messages, a Philippine fleet map and a typhoon simulation.">
        <source src="/story/elektron-film.mp4?v=production-polish" type="video/mp4" />
        Your browser does not support this video. <a href="/story/elektron-film.mp4">Download the film.</a>
      </video>
      <p>Electrical engineering × Meta AI <a href="/workspace?case=derating">Explore the investigation ↗</a></p>
    </dialog>
  </>;
}
