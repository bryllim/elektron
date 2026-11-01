export const MODEL_CATALOG = [
  {
    id: "wind-turbine",
    name: "Wind turbine",
    provider: "Innerscene",
    license: "CC0",
    path: "/models/innerscene/wind-turbine.glb",
    source:
      "https://www.innerscene.com/tools/library/3d-parts/wind-turbine-d67dce35",
    detail:
      "Original Rhino meshes converted to meters and Y-up. Original tower, nacelle, hub and blade shapes preserved; rotor pivot added for illustrative animation.",
  },
  {
    id: "cooling-tower",
    name: "Counterflow cooling tower",
    provider: "Innerscene",
    license: "CC0",
    path: "/models/innerscene/cooling-tower.glb",
    source:
      "https://www.innerscene.com/tools/library/3d-parts/cooling-tower-005ae63b",
    detail:
      "Packaged cooling unit with louvres, fan deck, ladder and service connections. Representative geothermal cooling layout; not sized to the site's MW rating.",
  },
  {
    id: "heat-exchanger",
    name: "Shell-and-tube heat exchanger",
    provider: "Innerscene",
    license: "CC0",
    path: "/models/innerscene/heat-exchanger.glb",
    source:
      "https://www.innerscene.com/tools/library/3d-parts/shell-and-tube-heat-exchanger-69685a9a",
    detail:
      "Original generic TEMA BEM heat-exchanger geometry with bonnets, flanges and saddles. Used in a representative thermal process layout.",
  },
  {
    id: "solar",
    name: "Solar array & rack",
    provider: "Grab3D",
    license: "CC0",
    path: "/models/grab3d/solar-panel.glb",
    source: "https://grab3d.com/models/electronics/solar-panel/",
    detail:
      "Framed modules, steel rack, concrete feet, junction boxes and cables. An externally authored visualization asset, not a manufacturer specification.",
  },
  {
    id: "ferns",
    name: "Scanned fern ground cover",
    provider: "Poly Haven",
    license: "CC0",
    path: "/models/polyhaven/fern_02.glb",
    select: "fern_02_a",
    source: "https://polyhaven.com/a/fern_02",
    detail:
      "Rico Cilliers and Rob Tuytel. Four original scanned fern clumps, 6,232 source triangles. Original fronds and textures retained; clustered around plant boundaries.",
  },
  {
    id: "tree",
    name: "Scanned island tree",
    provider: "Poly Haven",
    license: "CC0",
    path: "/models/polyhaven/island_tree_01.glb",
    source: "https://polyhaven.com/a/island_tree_01",
    detail:
      "Rob Tuytel and Rico Cilliers. Scanned bark and textured foliage; optimized mesh retains the source silhouette and leaf transparency.",
  },
  {
    id: "fence",
    name: "Chain-link perimeter",
    provider: "Poly Haven",
    license: "CC0",
    path: "/models/polyhaven/modular_chainlink_fence.glb",
    select: "modular_chainlink_fence_double",
    source: "https://polyhaven.com/a/modular_chainlink_fence",
    detail:
      "James Ray Cock and Amal Kumar. Repeated modular section with original wire and weathered metal materials.",
  },
  {
    id: "pole",
    name: "Utility pole assembly",
    provider: "Poly Haven",
    license: "CC0",
    path: "/models/polyhaven/modular_electricity_poles.glb",
    select: "preset_01_*",
    source: "https://polyhaven.com/a/modular_electricity_poles",
    detail:
      "Original assembled preset with pole, insulators, transformer cans and connection hardware. Visual representation only.",
  },
  {
    id: "inverter",
    name: "Wall inverter assembly",
    provider: "Innerscene",
    license: "CC0",
    path: "/models/innerscene/wall-inverter.glb",
    source:
      "https://www.innerscene.com/tools/library/3d-parts/wall-inverter-original-mep-cad-819279d7",
    detail:
      "26 source CAD parts, including the enclosure, display, hinges and connections. Generic equipment; no rated power or thermal calibration is implied.",
  },
  {
    id: "transformer",
    name: "Pad-mount transformer",
    provider: "Innerscene",
    license: "CC0",
    path: "/models/innerscene/transformer.glb",
    source:
      "https://www.innerscene.com/tools/library/3d-parts/pad-mount-transformer-original-mep-cad-97ec95a3",
    detail:
      "Converted from original STEP solids. Source dimensions are preserved in the representative plant layout.",
  },
  {
    id: "switchboard",
    name: "Electrical switchboard",
    provider: "Innerscene",
    license: "CC0",
    path: "/models/innerscene/switchboard.glb",
    source:
      "https://www.innerscene.com/tools/library/3d-parts/switchboard-original-mep-cad-15071089",
    detail:
      "69 original CAD parts, tessellated with source colors and batched for browser rendering.",
  },
  {
    id: "container",
    name: "Site storage container",
    provider: "Innerscene",
    license: "CC0",
    path: "/models/innerscene/container.glb",
    source:
      "https://www.innerscene.com/tools/library/3d-parts/40-ft-standard-shipping-container-5f94ec90",
    detail:
      "40 ft container with corrugated surfaces and door hardware. Replaces the former block-based building.",
  },
  {
    id: "barrier",
    name: "Steel safety barrier",
    provider: "NVIDIA SimReady",
    license: "CC BY 4.0",
    path: "/models/nvidia/barrier_fence_metal_a02.glb",
    source:
      "https://huggingface.co/datasets/nvidia/simready-assets/tree/4763fbfaa4f8e97658e68b57d01b4c86659e08b5/barrier_fence_metal_a02",
    detail:
      "Actual NVIDIA USD geometry and textures, converted to an optimized GLB. The browser version does not execute USD physics.",
  },
  {
    id: "terminal",
    name: "Electrical power terminal",
    provider: "NVIDIA SimReady",
    license: "CC BY 4.0",
    path: "/models/nvidia/electrical_power_terminal_a01.glb",
    source:
      "https://huggingface.co/datasets/nvidia/simready-assets/tree/4763fbfaa4f8e97658e68b57d01b4c86659e08b5/electrical_power_terminal_a01",
    detail:
      "Actual NVIDIA terminal assembly with original PBR textures. Used as a terminal, not relabeled as an inverter.",
  },
  {
    id: "rocks",
    name: "Scanned ground rocks",
    provider: "Poly Haven",
    license: "CC0",
    path: "/models/polyhaven/rock_moss_set_01.glb",
    select: "rock_moss_set_01_rock01",
    source: "https://polyhaven.com/a/rock_moss_set_01",
    detail:
      "Kless Gyzen / Poly Haven. Scanned rock geometry and moss materials placed outside the plant perimeter.",
  },
] as const;
