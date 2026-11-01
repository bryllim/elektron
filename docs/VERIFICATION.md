# Verification record

Verified October 30, 2026 (Asia/Manila).

## User story

Open the immersive Silangan Solar workspace → select equipment → inspect synchronized telemetry → investigate an output drop through the server agent route → inspect tool evidence → create and discard an isolated outage branch → download an incident handover. Fleet overview provides the Philippine map and all eight site overviews.

## Automated checks

- `npm test`: **21 passed, 0 failed**.
- `npm run typecheck`: passed.
- `npm run build`: production build passed with statically rendered application and dynamic `/api/agent` route.

The tests cover ratings reconciliation, fleet aggregation with storage separate, the solar equation and AC limits, nighttime standby, deterministic INV-07 derating, broad cloud effects, missing-data propagation and unsupported integration gaps, trapezoidal MWh integration, 32 MWh storage SOC/dispatch consistency, hydro limits, branch isolation, UTC/Manila timestamps, exact tool validation, evidence grounding, request validation, visible fallback on provider rate limits, bounded invalid tool calls, and cancellation without late viewer actions.

Provider-failure, malformed-call, and cancellation tests use synthetic mock responses. They do not establish actual Meta account access.

## Actual browser checks

| Flow | Observed result |
| --- | --- |
| Philippine map → Silangan | Map selection opens the connected solar workspace. |
| Real 3D rendering | The solar plant, instanced rows, equipment, terrain, selection indicator, orbit/focus controls, and power-flow particles render in WebGL. |
| Equipment list → inspector | Selecting INV-03 changes the inspector to INV-03; selecting INV-07 restores its derating readings. |
| Assembly | Exploded inverter components render; reassembly returns to the plant view. Geometry is labeled simplified educational content. |
| Investigator | The server returns the explicitly labeled Scripted demo agent with 7 tool actions, 322 kW actual, 699 kW expected, 54% shortfall, 74.3 °C, and the 13:15 controller event. |
| Clickable evidence | Peer-comparison evidence opens the supporting chart, frozen timestamp, units, quality, and raw tool readings. |
| 30-minute outage | Branch from 13:42–14:12 shows 3.832 MWh baseline, 3.676 MWh scenario, and 0.156 MWh reduction. Discard preserves the baseline. |
| Shift handover | Creating a shift summary produces the download action; the browser downloaded `elektron-incident-summary.txt`. |
| Telemetry interruption | INV-04 shows unknown AC output, missing quality, and the communication alarm, rather than confirmed equipment failure. |
| Nighttime | Under normal operation, scrubbing to 00:00 displays 0 kW, 0 expected, and Standby. |
| Motion control | Pause sets the interface motion mode to reduced; chart animation reports `none`. Motion can be resumed. |
| Responsive layout | Desktop 1440×900 and mobile 390×844 checked. Mobile document width is exactly 390px, with no horizontal page overflow. Panels stack for reading. |
| Credits and source mode | The exact requested credit and fictional/simulated labeling are present. No Live label is used. |

The old Drei DOM-label implementation generated React development warnings during initial QA; it was replaced with native Three.js sprite labels. Later scene interaction checks did not generate new versions of those warnings. The browser's retained log history may still contain messages from the removed implementation.

## Screenshots

Current design captures:

- `screenshots/digital-twin-glass.jpg`
- `screenshots/fleet-glass.jpg`
- `screenshots/agent-investigation-glass.jpg`
- `screenshots/what-if-glass.jpg`
- `screenshots/inverter-assembly-glass.jpg`
- `screenshots/mobile-glass.jpg`

Earlier `*-dark.jpg` files document intermediate styling, not the final design.

## Remaining integration dependencies and limits

- Actual Muse inference requires an authorized server-side Meta Model API key and model access. The credential-free agent is explicitly scripted.
- Updated: sourced NVIDIA, Poly Haven, Innerscene and Grab3D geometry is now used. See ASSETS.md for scope and provenance.
- Other technologies have working monitoring, trends, events, synthetic weather and selection, but no detailed equipment-level 3D model.
- No real facility, real SCADA/telemetry system, official weather service, physics-certified forecast, or production equipment control is connected.
- This is a runnable local prototype. It has not been published to external hosting.

## Chart and instrument polish — 30 October 2026

- Shared charts now measure their containers, use rounded axes including negative storage dispatch, preserve gaps, and provide pointer/touch and keyboard inspection with actual, expected, and difference values.
- Alarm markers align with the shared simulation timeline. What-if tooltips explicitly label the scenario and baseline.
- Generation mix supports source selection, percentages, partial-data labeling, and coordinated arc/legend highlighting. Technology colors match across the fleet.
- The plant dock includes a utilization gauge, reference-marked inverter bars, selected-equipment ratios, and missing-data hatching.
- Browser verification: donut selection, keyboard Home/End/arrow inspection, equipment changes, missing telemetry, and 390px mobile layouts. Both fleet and twin pages had no horizontal overflow. Browser error log was empty.
- Validation: 25 tests passed, TypeScript passed, production build passed. Added focused coverage for negative axes, empty/zero axes, rounded fleet bounds, and missing-reading path breaks.
- Screenshots: `screenshots/instruments-polished.jpg`, `screenshots/fleet-charts-polished.jpg`.

## Sourced assets update — 30 October 2026

- 11 source model types replace the former procedural equipment and vegetation; imported CAD parts replace the old six-block inverter inspection assembly.
- All catalog GLBs pass Khronos glTF validation without errors. Model tests also verify embedded buffers/textures, available selector nodes and source credit links.
- TypeScript, 26 automated tests, and the production build pass.
- Browser checks: plant rendering, material overlay, imported tree/fence/NVIDIA terminal previews, source credits, and sourced inverter inspection. Fixed a chart SVG title hydration mismatch encountered during these checks.
- Asset library includes source/license links and distinguishes scanned vegetation, authored visual models and generic CAD from calibrated equipment.
- Electrical output/thermal telemetry has not been upgraded to a new physical solver. Shadows remain visual; see SIMULATION.md.


## Decision workflow polish — October 30, 2026

- 46 automated tests pass; TypeScript and the production build pass.
- Added tests for shared UI/agent triage, weather-versus-equipment classification, null telemetry, named-site investigations, resource-impact ordering and storm cut-out versus nighttime standby.
- Mocked Meta success path verifies function tool results, encrypted reasoning replay, source references, model provenance and duration. Unknown citations visibly fall back. **Real Meta inference remains unverified: the running server reports no configured key.**
- Browser verified: playbook case loading; thermal investigation; 30-minute isolated outage (3.832 MWh baseline, 3.676 MWh alternative, 0.156 MWh difference at the seeded snapshot); branch discard; weather-aware rain answer; stale-answer notices; new investigation reset; fleet triage without unrelated asset focus.
- Downloaded and inspected a handover containing the original scenario, snapshot, scripted provenance, answer and source records.
- Storm case at 20:00 PHT shows Amihan at 0 MW and 30.9 m/s, labeled Wind cut-out; nighttime solar sites show Standby. Browser console reported no errors.
- Reused the shared modal focus handling, keyboard-accessible actions, reduced-motion support and existing smooth timeline/drawer transitions. No real equipment controls or production connection added.

## 3D scene polish — October 30, 2026

- Added locally stored, source-hash-verified Poly Haven ground maps (diffuse, normal, roughness), neutral rendering treatment, and wet-surface response. Sourced rock variants now appear around wind and geothermal sites.
- Solar, wind and geothermal illumination follows the replay clock with a neutral night fill. This is illustrative lighting, not surveyed sun positioning.
- Wind/geothermal focus and reset now ease over time and stop when the operator starts orbiting; solar easing is frame-rate independent. Motion-off remains immediate.
- All three workspaces provide an unobstructed 3D inspection mode. Hidden panels leave keyboard navigation, and the restore control stays reachable.
- Geothermal flow uses tapered particles on the segmented route. Solar pulses are omitted for missing or zero output. Rain placement seeds are precomputed rather than recalculated on every frame.
- Browser checked wind overview, geothermal focus in rain, solar power flow, expand/restore controls, and motion-off reset. No browser console errors observed. 46 existing regression tests and TypeScript checks pass; production build verified.

## Landscape and site detail — October 31, 2026

- Shared terrain now has layered height variation, slope shading and locally sourced Forest Ground 04 material maps. Solar, wind and geothermal vegetation uses grounded clusters with independent tree, fern and rock placement.
- Added the four sourced Fern 02 clumps and corrected instanced leaf depth rendering with alpha cutouts. Existing equipment geometry and weather-generation coupling are preserved.
- Wind and geothermal sites have additional sourced fences, poles, safety barriers and electrical-yard equipment, plus connected gravel access routes. These remain representative layouts, not as-built facilities.
- Browser reviewed all three plant landscapes, expanded scene controls, and rain response on the new geothermal surfaces. Browser warning/error logs were empty on the final check.
- 48 automated tests pass, including new terrain/placement checks and all catalog model validation. TypeScript and production build pass.
- Screenshot: `screenshots/landscape-polished-geothermal.jpg`.

## Meta model integration — October 31, 2026

- Spark quick and Wonder deep investigations share the validated telemetry tools, evidence IDs, isolated what-if flow and cancellation. Responses include model, token usage and duration; encrypted reasoning remains server-side and replays with the required summary field.
- Added explicit model text probes and SAM 3.1 image segmentation followed by Spark image interpretation. Official parser decodes streamed boxes/masks; limits reject malformed media, incomplete streams and invalid coordinates. Partial visual-review failures retain SAM results with an explicit notice.
- 57 tests pass, TypeScript passes and production build passes. New contract tests use mocked provider responses and Meta's documented SAM mask fixture; they cover split network chunks, source alignment, zero matches, unknown URLs, oversized requests, no-key behavior, access failures and cancellation.
- Browser checked model selection, clearly labeled scripted fallback with no key, the connection workspace, disabled inference controls and local demo image preview.
- **Live Meta inference remains unverified until the user supplies an authorized API key.** No keys were added or external model calls made during this implementation. Follow `docs/META_SETUP.md` to verify project access and both text and image inference.

## Project story page — October 31, 2026

- Added a server-rendered editorial home page with the team's engineering context, renamed public identities, plain-language anomaly investigation, Meta model roles, and expandable calculation/provenance notes. No customer counts, measured savings or deployment statistics were added.
- Equipment, weather and missing-signal examples share the simulation engine and chart component. New regression checks verify the MW-to-kW conversion, chart/headline agreement, weather expectations, missing values and matching Playbook case IDs.
- Moved operations to `/workspace`; optional case links initialize the exact site, time, scenario, asset and overlay. Browser checked the telemetry case opening INV-04 with unknown generation and the derating case opening INV-07 at 322 kW.
- Repaired direct 3D scene loading: loading text now lives outside the Three.js Suspense tree, avoiding nested HTML roots and progress updates during renderer transitions. After repair, direct scene reload and return-home navigation produced no new console errors.
- Browser checked all three explanation choices, calculation accordion, 390px mobile layout and chart, and default desktop layout. Mobile document width equals viewport width. Temporary viewport override was reset.
- 59 tests pass; TypeScript and production build pass. Home page is statically rendered; workspace reads case parameters on the server. Live Meta inference still requires credentials and remains unverified.
- Screenshot: `screenshots/project-story-home.png`.
