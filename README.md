# Elektron

**Find the cause. Test the response.** Elektron helps renewable fleet operators distinguish equipment faults from weather losses and missing telemetry, verify the evidence in a 3D twin, and compare an intervention before preparing a shift handover.

The demo joins a Philippine fleet view, sourced WebGL equipment, deterministic weather-coupled telemetry and Meta Muse tool calling in one reproducible operations workflow.

**Built by Bryl Lim with Engr. Will Delos Reyes**

**Fictional company · Simulated operations.** Hiraya Renewables, its eight facilities, layouts, equipment ratings, histories, events, and measurements are fictional. This prototype has no connection to a real facility and carries no engineering certification or external validation.

## Clone with video assets

The private repository includes the app, finished films (including prior editions), source footage, sound design, editable film sources and optimized 3D assets. Large media use Git LFS. Install [Git LFS](https://git-lfs.com/) before cloning:

```sh
git lfs install
git clone git@github.com:bryllim/elektron.git
cd elektron
git lfs pull
```

Latest film: `video/elektron-polished/ELEKTRON-Polished-1080p60.mp4` (master) and `video/elektron-polished/ELEKTRON-Polished-Web.mp4` (web copy). The landing player serves `public/story/elektron-film.mp4`. Each film folder retains its brief and source credits. Native film sources contain authoring-machine paths; update those paths when editing on another machine.

Dependencies, Python environments, downloaded installers, render-frame caches, duplicate intermediate exports and local credentials are excluded. Finished video exports are retained.

## Run

Requires Node.js 20.17+ (20.x) or 22.9+, matching the official Meta SAM parser's supported runtimes.

```sh
npm install
npm run dev
```

Open the Local URL printed by Next.js. The current workspace preview uses [localhost:3001](http://localhost:3001). If that port is unavailable, Next.js prints another available port.

```sh
npm test
npm run typecheck
npm run build
npm start
```

No account, database, paid asset, NVIDIA software, or special GPU is required. Monitoring and scripted investigations work without credentials.

## Experience

The home page is an editorial project story for a non-specialist reader: the engineering team’s workflow, privacy-safe public examples, an interactive anomaly explanation, Muse’s role and expandable technical notes. Its examples use the same calculations as the workspace. Open `/workspace` for the demo, or `/workspace?case=derating`, `rain`, `telemetry` or `typhoon` to load a reproducible incident.

The operations demo is a decision-focused fleet workspace: an operational brief separates equipment flags, unknown output and weather impact, above the Philippine network and generation analytics. The Playbook loads four reproducible cases: inverter derating, rain, telemetry interruption and typhoon exposure. Solar, wind and geothermal twins use a neutral dark environment with translucent blurred panels, sourced equipment, animated energy flow and a shared replay clock.

Animations include geographic network flows, facility beacons, progressive chart drawing, staggered panel transitions, presentation-only number interpolation, smooth 3D camera transitions, selection rings, power-flow particles, and component explosion. The toolbar motion control pauses animation. System reduced-motion preferences also apply. No animation changes the underlying measurements or signals a real connection.

- **Fleet:** eight selectable sites across Luzon, Visayas, and Mindanao, aggregate generation and net export, integrated daily energy, generation mix, output history, technology/region filters, and asset table.
- **Silangan Solar:** a fictional 12 MWp DC / 10 MW AC plant, twelve inverters, two collection groups, transformers, switchgear, control building, grid connection, service roads, fencing, and instanced PV rows.
- **3D viewer:** orbit, zoom, reset, focus, isolate, labels, actual AC output, relative utilization, deviation, power-flow overlay, and one simplified exploded inverter assembly. Equipment buttons provide an accessible alternative to canvas selection.
- **Other sites:** Amihan and Habagat have sourced animated turbine twins; Bukal has a geothermal twin with sourced industrial equipment. All sites have telemetry, trends, synthetic weather and CSV export. Storage SOC is shown separately from generation. Mountain terrain is representative, not surveyed geography.
- **Weather:** shared rain, cloud and wind scenarios change modeled output and scene behavior. The fictional typhoon field includes generated satellite layers, moving local weather and wind cut-out. No real satellite feed or official advisory is connected.
- **Replay:** pause/play, timeline, 1/5/15 simulation minutes per real second, reproducible scenarios, reset, and return to the 13:42 demonstration snapshot. All underlying timestamps are UTC; visible clocks are Asia/Manila.
- **Agent:** frozen-snapshot evidence, tools, equipment highlighting, clickable supporting charts/raw measurements, cancellation/retry, follow-up simulations, and downloadable shift summaries.
- **What-if:** inverter outage or reduced POA irradiance, configurable duration, baseline/scenario curves, integrated energy difference, explicit assumptions, and branch discard.

## Muse integration

Copy `.env.example` to `.env.local` and supply a Meta Model API key that has access to the chosen model. Restart the server after changing environment variables.

The agent offers **Quick · Muse Spark** (`muse-spark-1.3`) and **Deep · Muse Wonder** (`muse-wonder-1.0`) through Meta's Responses API with 13 validated function tools and a bounded loop (7 rounds / 18 tool calls). The operational-brief tool shares its snapshot with the fleet UI; site-specific tools provide peers, alarms, weather, energy and isolated what-if branches. Answers must cite existing returned evidence IDs or the route falls back explicitly. This checks citation existence, not the semantic correctness of every claim. Stateless encrypted reasoning items are replayed to the provider but never shown in the interface. Credentials stay server-side. Quick requests have a 60-second deadline; deep requests have 110 seconds. Both propagate cancellation and return model/usage provenance on success.

**Agent → Models & vision** provides explicit model connection checks and a visual inspection workflow. SAM 3.1 localizes objects with boxes and masks; Muse Spark reviews the same image and explains visual limits. Upload a photo or load the labeled simulated scene. Previews work without credentials; actual image inference requires the Meta key. The app does not fabricate masks or substitute scripted visual diagnoses. Exported image reports remain separate from telemetry and physical equipment control.

See [Meta setup and hackathon workflow](docs/META_SETUP.md) for key configuration, model access checks, supported image formats, exact request contracts, limits and a demonstration sequence.

The Playbook distinguishes configured credentials from verified inference. A successful model answer shows its model, response duration, source count and completed tool activity. Tests exercise a mocked successful Meta tool loop and encrypted reasoning replay; they do not substitute for a real credentialed call.

Without a key, the UI explicitly says **Scripted demo agent**. Provider errors also return a visibly labeled scripted fallback. The fallback executes the same deterministic evidence tools; it is not Muse inference. Provider account access and real model inference cannot be verified without authorized credentials.

Reference: [Meta Responses API](https://dev.meta.ai/docs/protocols/responses), [model availability](https://dev.meta.ai/docs/models) and [SAM client libraries](https://dev.meta.ai/docs/sam/client-libraries), consulted October 31, 2026.

## Structure

| Location                    | Responsibility                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/simulation.ts`         | Fleet ratings, stable asset registry, deterministic solar/wind/geothermal/hydro/storage models, quality flags, alarms, time, integration, branch calculations, and telemetry adapter |
| `lib/operations.ts` | Shared rule-based diagnostic priorities and reproducible playbook cases |
| `lib/agent-tools.ts`        | Exact Zod tool schemas, bounded identifiers/time windows, evidence IDs, viewer actions, scripted investigation, incident generation                                                  |
| `app/api/agent/route.ts`    | Server-only Muse orchestration, timeout, cancellation, fallback                                                                                                                      |
| `components/TwinViewer.tsx` | Real Three.js geometry, instancing, raycast selection, camera controls, educational assembly                                                                                         |
| `components/FleetMap.tsx`   | Natural Earth geography, approximate fictional coordinates, site selection and logical topology                                                                                      |
| `components/Workspace.tsx`  | One shared simulation clock, scenario and selection state, navigation and dialogs                                                                                                    |
| `tests/simulation.test.ts`  | Calculation, aggregation, determinism, quality, tool-validation and branch-isolation tests                                                                                           |

The telemetry adapter is an explicit future integration boundary. No real equipment controls, unrestricted URLs, shell tools, or arbitrary database queries are exposed to the agent. No real operational data connector is supplied.

## Fleet ratings

| Fictional site   | Location          | Technology |           AC rating |
| ---------------- | ----------------- | ---------- | ------------------: |
| Amihan Wind      | Ilocos Norte      | Wind       |               32 MW |
| Silangan Solar   | Nueva Ecija       | Solar      |   10 MW (12 MWp DC) |
| Bukal Geothermal | Batangas          | Geothermal |               22 MW |
| Habagat Wind     | Aklan             | Wind       |               24 MW |
| Isla Storage     | Bohol             | Storage    |      ±8 MW / 32 MWh |
| Sidlak Solar     | Negros Occidental | Solar      | 18 MW (21.6 MWp DC) |
| Tala Solar       | Bukidnon          | Solar      | 14 MW (16.8 MWp DC) |
| Agos Hydro       | Davao de Oro      | Hydro      |               16 MW |

Generation capacity is 136 MW AC. Storage is separate. Positive storage dispatch is discharging/export; negative is charging/import. Map locations are approximate provincial demonstration coordinates and are not assertions about real assets or ownership. Animated network links show logical fleet membership, not physical transmission lines.

## Further documentation

- [Simulation assumptions and limitations](docs/SIMULATION.md)
- [Assets, licenses and sources](docs/ASSETS.md)
- [Hackathon demonstration script](docs/DEMO.md)
- [Verification record](docs/VERIFICATION.md)
- [Browser screenshots](screenshots/)
