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
    }}><Play size={16} strokeWidth={1.5} fill="currentColor" />Watch with sound <span>2:22</span></button>
    <dialog ref={dialog} id="elektron-film" className="story-film-dialog" aria-labelledby="film-title" onCancel={() => player.current?.pause()} onClose={() => {
      player.current?.pause();
      trigger.current?.focus({ preventScroll: true });
    }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
    }}>
      <div className="story-film-bar"><h2 id="film-title">ELEKTRON <span>Launch film</span></h2><button className="story-film-close" aria-label="Close film" onClick={close}><X size={16} strokeWidth={1.5} /></button></div>
      <video ref={player} controls playsInline preload="none" poster="/story/v4/film-poster.webp" aria-label="Elektron launch film, 2 minutes 22 seconds, narrated">
        <source src="/story/elektron-film.mp4" type="video/mp4" />
        Your browser does not support this video. <a href="/story/elektron-film.mp4">Download the film.</a>
      </video>
      <p>Fictional fleet · Simulated operations <a href="/workspace?case=derating">Explore the investigation ↗</a></p>
    </dialog>
  </>;
}
