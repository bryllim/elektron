# Elektron — hackathon demonstration

## Product story

Renewable fleet operators need to explain a power drop before deciding whether to dispatch maintenance, watch the weather, or restore a data link. Those three problems can look similar on a generation chart. Elektron joins the measurements, controller events, weather and physical equipment in one investigation, then compares an isolated response and produces a traceable handover.

The demonstration operator, Hiraya Renewables, and all its facilities are fictional. The problem is the product hypothesis; no measured customer savings or deployment is claimed.

## Three-minute walkthrough

1. **0:00–0:25 · Start with a decision.** Start at `/workspace` for Fleet operations. The home page introduces the project story; its “Enter the demo” link opens this workspace. Read the operational brief: one equipment flag, no unknown sites, and no weather reduction in the seeded derating case. These are deterministic triage findings shared with an agent tool. Explain the operator's question: “Is this a fault, a resource change, or missing data?”
2. **0:25–1:15 · Investigate the equipment case.** Open Playbook → “Equipment or weather?” The scene loads Silangan at 13:42 PHT with the deviation overlay. Click **Investigate cause**. Muse, when configured, chooses validated tools; without credentials the response is explicitly scripted. Show the completed tool activity and click the peer evidence: INV-07 produces approximately 322 kW against 699 kW expected, with 74.3 °C and a 13:15 controller event. The underlying cooling fault remains unverified.
3. **1:15–1:50 · Test before intervening.** Click **Try a 30-min outage**. Compare the modeled baseline and alternative energy, including the MWh difference. Discard the branch; baseline telemetry remains unchanged. This is a simplified deterministic scenario, not an engineering forecast or a physical command.
4. **1:50–2:15 · Close the operational loop.** Download the handover. It preserves the answer, source records, model/demo provenance, scenario and snapshot. Export measurements if needed. Explain that a future real deployment would require approved data adapters and engineering validation.
5. **2:15–2:45 · Show why context matters.** Close the agent. Open Playbook → “Resource or failure?” Investigate rain-reduced solar generation: expected power already includes weather, so low output alone does not imply an inverter failure. Optionally show “Zero or unknown?”: missing INV-04 telemetry must not become zero generation or a complete fleet total.
6. **2:45–3:00 · Extend to the fleet.** Open Playbook → “What is exposed?” The case loads 20:00 PHT: Amihan is parked above its modeled wind cut-out, while solar sites are in nighttime standby. Generated satellite fields drive local weather, solar attenuation and wind cut-out as the clock is replayed. **Investigate fleet** ranks sites without jumping to an unrelated solar inverter. State that all satellite imagery and track data are synthetic.

## Meta's role

Meta Muse Spark (`muse-spark-1.3` by default) orchestrates the investigation through the Responses API. It can call 13 bounded tools to read the fleet brief, site measurements, inverter trends, peers, alarms, weather and energy; focus equipment; change viewer overlays; calculate isolated scenarios; and prepare evidence-based summaries.

The agent's model selector also offers **Deep · Muse Wonder** (`muse-wonder-1.0`) with the same evidence tools. **Models & vision** opens text-connection checks and the SAM 3.1 → Muse Spark image review. Load the rendered Bukal scene, keep its simulated source label, select cooling towers, and run inspection only after configuring the key. Show the returned masks, object selection, interpretation limits and exported review. Model localization does not establish equipment condition or physical capacity. See [Meta setup](META_SETUP.md) for the full workflow.

The model chooses what to inspect and how to explain the evidence. The deterministic engine owns numerical calculations and data quality. This separation makes the model's actions inspectable and avoids asking a language model to invent plant physics. The model has no real equipment controls.

Stateless encrypted reasoning items are replayed inside the tool loop. Responses identify the provider/model, duration and evidence sources. Invalid tool arguments and unsupported citations cannot silently become viewer actions or final model findings. Missing credentials, timeouts and provider failures visibly fall back to a scripted demonstration.

**Before recording a Meta-powered submission:** configure `META_API_KEY` server-side using `.env.example`, restart the app, run an investigation and confirm the answer shows **Muse · Meta Model API**, a model name and tool evidence. A “key configured” status alone does not prove inference. The current development preview has been verified in scripted mode; mocked API tests do not establish live provider access. Do not paste keys into the browser or commit them.

## Fit to the event

The official event describes “Build for Your World” and “Push the Frontier,” with energy and understanding physical systems explicitly included. Elektron demonstrates both a domain-specific operator workflow and a model acting through a constrained digital twin. The published track descriptions emphasize creativity, technical ambition and functionality for indie entries; technical execution and production durability for startup entries. Choose the actual eligible track at submission—this prototype is not presented as production deployed.

Sources checked October 30, 2026:
- [Official event and themes](https://events.cerebralvalley.ai/e/meta-ai-developer-hackathon)
- [Meta Responses API](https://dev.meta.ai/docs/protocols/responses)
- [Meta model availability](https://dev.meta.ai/docs/models)

## What to substantiate, not claim

- No invented time savings, revenue recovery, customers or reliability measurements.
- Sourced NVIDIA SimReady geometry is used in the browser; NVIDIA Omniverse physics is not connected. Other assets come from credited sources in ASSETS.md.
- Solar, wind, weather, temperature and energy behavior are simplified documented models. Geography is representative and facilities are fictional.
- Synthetic satellite imagery is not an observed storm or official warning.
- Citation existence is checked; a human still must assess whether an interpretation is supported.
