"use client";
import { useEffect } from "react";

/** Commits only after the scene's Suspense boundary has resolved. */
export function SceneReady({ onReady }: { onReady: (ready: boolean) => void }) {
  useEffect(() => {
    onReady(true);
  }, [onReady]);
  return null;
}

/** Keep loading UI in the DOM tree, outside the suspended Three.js renderer. */
export function SceneLoadingOverlay() {
  return (
    <div className="scene-loading-overlay" role="status">
      Loading sourced environment…
    </div>
  );
}
