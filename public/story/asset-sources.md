# Assets and attribution

The plant now loads third-party 3D assets from local GLB files. The **3D asset library** in the sidebar provides interactive previews, source links, and license credits for each asset. Three.js remains the browser renderer; importing NVIDIA assets does not require an NVIDIA GPU.

## Imported models

| Model | Creator / source | License | Browser changes |
|---|---|---|---|
| Steel safety barrier, `barrier_fence_metal_a02` | [NVIDIA SimReady](https://huggingface.co/datasets/nvidia/simready-assets/tree/4763fbfaa4f8e97658e68b57d01b4c86659e08b5/barrier_fence_metal_a02) | CC BY 4.0 | USD render meshes triangulated and grounded; Z-up to Y-up; PBR textures resized to 1K WebP; geometry optimized |
| Electrical power terminal, `electrical_power_terminal_a01` | [NVIDIA SimReady](https://huggingface.co/datasets/nvidia/simready-assets/tree/4763fbfaa4f8e97658e68b57d01b4c86659e08b5/electrical_power_terminal_a01) | CC BY 4.0 | Same conversion; used as an electrical terminal, not an inverter |
| Island Tree 01 | [Rob Tuytel and Rico Cilliers / Poly Haven](https://polyhaven.com/a/island_tree_01) | CC0 | Scanned model simplified for repeated rendering; original UVs, bark and foliage maps retained; 1K WebP |
| Fern 02 | [Rico Cilliers and Rob Tuytel / Poly Haven](https://polyhaven.com/a/fern_02) | CC0 | Four original fern clumps, source UVs retained, 1K WebP textures; instanced with alpha-cutout foliage |
| Modular Chainlink Fence | [James Ray Cock and Amal Kumar / Poly Haven](https://polyhaven.com/a/modular_chainlink_fence) | CC0 | Double-width source section selected and repeated; source wire transparency retained; 1K WebP |
| Modular Electricity Poles | [James Ray Cock / Poly Haven](https://polyhaven.com/a/modular_electricity_poles) | CC0 | Original `preset_01` assembled model selected, centered and repeated; 1K WebP |
| Rock Moss Set 01 | [Kless Gyzen / Poly Haven](https://polyhaven.com/a/rock_moss_set_01) | CC0 | First scanned rock selected and placed around the site; 1K WebP |
| Ground-mounted solar array | [Grab3D](https://grab3d.com/models/electronics/solar-panel/) | CC0 | Original 8,608-triangle array, rack, footings and cables; textures reduced to 1K WebP; instanced across zones |
| Wall inverter | [Innerscene Corp](https://www.innerscene.com/tools/library/3d-parts/wall-inverter-original-mep-cad-819279d7) | CC0 | 26 STEP parts tessellated at 0.3 mm; original colors retained; meter/Y-up normalization; separate original parts retained for illustrative inspection |
| Pad-mount transformer | [Innerscene Corp](https://www.innerscene.com/tools/library/3d-parts/pad-mount-transformer-original-mep-cad-97ec95a3) | CC0 | STEP to GLB, original colors, meter/Y-up normalization, mesh batching |
| Switchboard | [Innerscene Corp](https://www.innerscene.com/tools/library/3d-parts/switchboard-original-mep-cad-15071089) | CC0 | Same STEP conversion |
| 40 ft storage container | [Innerscene Corp](https://www.innerscene.com/tools/library/3d-parts/40-ft-standard-shipping-container-5f94ec90) | CC0 | Same STEP conversion; replaces the former procedural building |

NVIDIA source revision: `4763fbfaa4f8e97658e68b57d01b4c86659e08b5`. Package manifests and original license text were checked. The distributed NVIDIA license is `public/models/nvidia/LICENSE.txt`; source and output hashes are retained in asset manifests. No NVIDIA endorsement is implied. The rejected main-terminal candidate was a workstation and is **not** used.

Powered by [Poly Haven](https://polyhaven.com). Poly Haven originals and metadata were fetched through its public API with a named importer. The browser serves local converted assets; it does not depend on the API at runtime.

Grab3D discloses that its model was authored with procedural Blender scripts assisted by AI coding tools. It is an externally sourced model, not a scan or OEM model. Its original license/disclosure is distributed at `public/models/grab3d/LICENSE.txt`. Innerscene's models are generic CAD reconstructions, not manufacturer-certified equipment. Scanned vegetation and authored industrial models are distinguished in the asset library.

[Studio Small 09 HDRI by Poly Haven](https://polyhaven.com/a/studio_small_09), CC0, supplies reflection lighting from a local 1K HDR file. It does not replace the dark backdrop.

## What remains application-authored

Terrain height field, site pad, service roads, logical power-flow lines, selection indicators, labels and interface charts remain application layout/visualization geometry. Equipment models, trees, fence, poles, rocks and container are imported. The inverter inspection view uses original imported parts with illustrative separation offsets; it is not an assembly/disassembly procedure.

The plant layout and counts remain representative. Solar arrays are not a bill of materials for a 12 MWp plant. Each INV identifier denotes a simulated capacity zone; the small imported string-inverter models do not claim an 833 kW equipment rating. Geometry and visual shadows do not automatically drive the telemetry model. See [simulation assumptions](engineering-notes.md).

## Rebuilding the assets

Source downloads are cached under `simulation/assets/` and excluded from version control. Browser deliverables are under `public/models/`.

- `python3 scripts/assets/import_simready.py` downloads pinned USD layers and metadata.
- `uv run --python 3.12 --with usd-core --with numpy --with pillow python scripts/assets/convert_simready.py` converts USD render meshes and retrieves their texture dependencies.
- `python3 scripts/assets/import_polyhaven.py` downloads original glTF packages, metadata and hashes.
- `node scripts/assets/optimize_polyhaven.mjs island_tree_01 modular_chainlink_fence modular_electricity_poles rock_moss_set_01 fern_02` prepares Poly Haven GLBs.
- `node scripts/assets/import_cad.mjs` downloads the listed Innerscene STEP originals and Grab3D solar array.
- `node scripts/assets/convert_cad.mjs` converts the CAD models.
- `node scripts/assets/optimize_browser.mjs` optimizes NVIDIA and Grab3D browser copies and writes output hashes.

USD physics schemas, MDL rendering, articulation/runtime state and validation profiles are **not** transported into glTF. PBR Preview Surface is approximated for the browser; the downloaded USD layers remain the source of truth for NVIDIA-specific metadata.

## Philippine geography

[Country geometry by Natural Earth contributors](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson), [public domain](https://www.naturalearthdata.com/about/terms-of-use/). Only Philippines geometry was retained in `public/philippines.json`. Facility markers are original approximate fictional coordinates; animated links are logical relationships, not transmission infrastructure.

## Interface and dependencies

Lucide icons: ISC. Three.js, React, React Three Fiber, Drei and Next.js: MIT. Asset build tools retain their respective package licenses. Typography uses the operating-system font stack. The interface is an original interpretation of user-provided dashboard references; no Palantir branding or defense scenario was copied.

The official `@meta-sam/parser` dependency is distributed under Meta's **SAM License**, retained in the installed package. It decodes model output on the server; SAM weights are not bundled. `public/demo/plant-inspection.jpg` is a screenshot of Elektron's own representative geothermal scene, using the credited assets above. It is labeled as a simulated scene, not a field photograph.

Built by Bryl Lim with Engr. Will Delos Reyes.

## Wind and geothermal scene additions

- Wind turbine: https://www.innerscene.com/tools/library/3d-parts/wind-turbine-d67dce35 — CC0. Rhino source meshes are preserved; millimetres/Z-up converted to metres/Y-up. A pivot groups the original hub and three blades; the tower stays fixed. Rebuild with `uv run --with rhino3dm python scripts/assets/convert_wind_turbine.py`.
- Counterflow cooling tower: https://www.innerscene.com/tools/library/3d-parts/cooling-tower-005ae63b — CC0.
- Shell-and-tube heat exchanger: https://www.innerscene.com/tools/library/3d-parts/shell-and-tube-heat-exchanger-69685a9a — CC0.
- Original downloads and hashes: `public/models/innerscene/plant-assets-sources.json`. The thermal GLBs are batched with `node scripts/assets/prepare_thermal_assets.mjs`.

The geothermal view is a representative thermal island, not an as-built 22 MW plant or a capacity-sized equipment design. Trees, containers, transformers and switchgear reuse credited source assets above. Rain and vapor are visual particle effects. No new procedural equipment models were substituted for sourced geometry.

## Ground surfaces — October 30 polish

Service pads and roads use the **Gravelly Sand** diffuse, OpenGL normal and roughness maps from [Poly Haven](https://polyhaven.com/a/gravelly_sand), licensed [CC0](https://polyhaven.com/license). The 1K originals are stored locally under `public/textures/gravelly-sand/`; `source.json` records download URLs, sizes and verified source MD5 hashes. Rendering desaturates the surface to fit the charcoal operations palette; original files remain unchanged. No runtime external asset requests are needed.

Wind and geothermal environments reuse the six existing scanned rock variants and the sourced island tree with grounded, varied placements. Terrain remains representative geometry, not surveyed elevation. Time-dependent illumination is illustrative and not a calibrated solar-position calculation.

## Landscape detail — October 31, 2026

All three plant landscapes use [Forest Ground 04 / Poly Haven](https://polyhaven.com/a/forest_ground_04), CC0, with locally stored 1K diffuse, OpenGL normal and roughness maps. `public/textures/forest-ground/source.json` retains source URLs and verified MD5 hashes. Service surfaces retain the gravel material above.

Trees, four fern clump variants and six scanned rock variants are arranged in independent, deterministic clusters. Alpha-cutout leaves retain source textures while avoiding blended-leaf sorting artifacts across instances. Terrain heights are shared with vegetation placement, with clear plant pads and service routes. Geothermal and wind sites reuse the credited fences, utility poles, barriers, terminal and switchboards for additional yard detail. These are representative layouts, not surveyed sites.

## Project story illustration

`public/story/solar-twin.png` is a screenshot captured from Elektron’s working solar viewer. It depicts the same sourced geometry listed above, in a representative layout. It is not a photograph of a real facility.

## Landing-page plant preview

`plant-preview.mp4` is a locally rendered, silent excerpt from the ELEKTRON film, showing the same sourced solar, wind and geothermal geometry. Its outdoor reflections use [Industrial Sunset 02 (Pure Sky)](https://polyhaven.com/a/industrial_sunset_02_puresky), by Sergej Majboroda, sky edits by Jarod Guest (CC0). NVIDIA geometry retains the CC BY 4.0 attribution above; see the [license](https://creativecommons.org/licenses/by/4.0/). It is a representative rendered layout, not footage of an identified operating plant.

The full project film (`elektron-film.mp4`) uses the same models and original synthesized music and weather audio. Rain scenes additionally use [Kloofendal Overcast (Pure Sky)](https://polyhaven.com/a/kloofendal_overcast_puresky), by Greg Zaal (CC0). Terrain, weather and transitions are authored simulation visuals.

## Previous film revision — The afternoon alarm

The full film now tells the investigation through a scripted conversation between Bryl and Engr. William, using animated speech bubbles and inline data/action pills. Initials identify the authors; no portrait photographs were synthesized. The source project is `video/elektron-story`, with a separate editable Diffusion Studio project named ElektronStory.

This revision adds physical solar-glass materials, wet-ground shaders, foliage masks, contact shading and depth of field for close-ups. The referenced geometry and HDR licenses above still apply. The conversation illustrates the public simulation and Meta integration workflow; it is not a recording of live provider calls. Rain-only and equipment-derating comparisons are kept separate. The instrumental and weather sound are original local synthesis, retimed to the conversation; there is no narration.

## Previous film — Light conversation edition

The current 120-second film (`video/elektron-light`) opens with the problem and scenario, including “We built ELEKTRON, powered by Meta Muse.” The recreated UI, evidence and speech bubbles use light mode, blue readings and green actions. Bryl, Engr. William and Meta Muse appear as conversation participants. Avatars sit at the lower-left of shadow-free bubbles. The underlying simulation and model-call context described above still applies.

Real stock portraits are illustrative character avatars, not verified photographs of Bryl or Engr. William and not endorsements or testimonials from the people photographed:

- Bryl character: [Kenneth Surillo / Portrait of a Man in Glasses](https://www.pexels.com/photo/portrait-of-a-man-in-glasses-21847702/).
- Engr. William character: [Hao Peng / Professional portrait of man in glasses](https://www.pexels.com/photo/professional-portrait-of-man-in-glasses-30975992/).
- Both portraits use the [Pexels License](https://www.pexels.com/license/); source downloads and cropped avatars are retained in `video/elektron-light/media`.
- Meta Muse uses the project’s existing `meta-muse.webp` brand asset.

Send pops, reply tones, typing taps and evidence confirmation sounds are original synthesis. No proprietary messenger sound samples are used; the earlier whoosh transitions have been removed. No narration, screenshots or screen recordings are used in this edit.

## Previous film — Cinematic group chat edition

`video/elektron-cinematic` retains all credited source assets above. No new stock geometry or photographs were introduced. Localized black gradients replace broad white overlays on 3D scenes. The light speech bubbles use a shared spring animation; the introduction accumulates messages with typing indicators and smooth reflow.

The sourced foliage uses matte diffuse materials, the scanned ground textures use wet-surface shading and restrained saturation, and equipment has revised paint/metal roughness, contact shading and studio lighting. Fog and rain density are reduced for visibility. Intro, Meta evidence boards and final bento retain light backgrounds. Typing sounds are original synthesis.

## Previous film — Philippine fleet and typhoon edition

`video/elektron-regional` adds an opening map using the Natural Earth geography and eight approximate fictional facility coordinates already credited above. A dedicated typhoon replay uses the app's deterministic storm field, synthetic satellite-style cloud rendering, wind power curve and solar-input attenuation. It is labeled as a simulation; no observed satellite imagery or official warnings are used.

Speech bubbles are cached at final resolution and composed as complete layers, avoiding font scaling and independent pill-opacity changes. Intro history reflow respects message heights. Existing portraits, sourced 3D assets and original synthesized audio retain their prior credits.

## Current film — Production polish edition

`video/elektron-polished` retains all credited assets and simulation provenance. Visible demo wording and duplicate leading explanations have been removed. The data graphics and chat are rendered as complete canvas layers. The film adds supersampled, multisampled 3D rendering, revised lighting, smoother camera paths, gentler terrain, additional instances of the sourced tree asset and turbulent steam. The existing chat soundtrack remains unchanged. No observed satellite data, new stock portraits or new model assets were introduced.
