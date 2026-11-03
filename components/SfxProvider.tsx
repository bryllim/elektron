"use client";
import { useEffect } from "react";
import { installSfx } from "@/lib/sfx";

/** Adds synthesized hover and click sounds to every clickable element on the site. */
export default function SfxProvider() {
  useEffect(() => installSfx(), []);
  return null;
}
