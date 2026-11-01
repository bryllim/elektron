"use client";
import { useMemo } from "react";
import { MODEL_PATHS, SourcedInstances } from "./SourcedModels";
import { landscapePlacements } from "@/lib/site-landscape";
import type { TerrainKind } from "@/lib/terrain";
export default function SiteSurroundings({ kind }: { kind: TerrainKind }) {
  const placement = useMemo(
    () => ({
      trees: landscapePlacements(kind, "trees"),
      ferns: landscapePlacements(kind, "ferns"),
      rocks: landscapePlacements(kind, "rocks"),
    }),
    [kind],
  );
  return (
    <>
      <SourcedInstances
        path={MODEL_PATHS.tree}
        placements={placement.trees}
        foliage
      />
      {["a", "b", "c", "d"].map((variant, i) => (
        <SourcedInstances
          key={variant}
          path={MODEL_PATHS.fern}
          select={`fern_02_${variant}`}
          placements={placement.ferns.filter((_, n) => n % 4 === i)}
          foliage
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <SourcedInstances
          key={i}
          path={MODEL_PATHS.rocks}
          select={`rock_moss_set_01_rock0${i + 1}`}
          placements={placement.rocks.filter((_, n) => n % 6 === i)}
        />
      ))}
    </>
  );
}
