# Meta integration and hackathon workflow

Verified against Meta's public documentation and the [Meta Global AI Developer Hackathon brief](https://cerebralvalley.ai/e/meta-ai-developer-hackathon) on October 31, 2026.

## What is integrated

| Capability | Default model | Elektron workflow |
| --- | --- | --- |
| Quick investigation | `muse-spark-1.3` | Retrieve telemetry, compare expected output, inspect peers, weather and alarms; cite the frozen evidence snapshot. |
| Deep analysis | `muse-wonder-1.0` | Use the same 13 validated tools with a larger reasoning/output budget for complex investigations and explicitly requested what-if branches. |
| Visual interpretation | `muse-spark-1.3` | Review an operator image alongside SAM object locations; explain visible observations, a next check and limitations. |
| Image segmentation | `sam-3.1` | Return object boxes, decoded masks and optional model confidence for panels, turbines, trees, cooling towers or water. |

The same Meta Model API key serves these models, subject to project access and quota. Partner inference services are optional in the public event brief; this app uses Meta directly. Muse Image is not part of the evidence workflow: generated images are not inspection evidence. Muse Wonder Full is not available through the Model API according to [Meta's model availability documentation](https://dev.meta.ai/docs/models).

This supports the event's **Push the Frontier** energy theme and **Build for Your World** domain workflow. The public brief emphasizes working technical execution and an identifiable problem. It does not require every listed model or partner. This document maps the implementation to that brief; it does not replace the organizers' final submission rules.

## Add your key

1. Copy `.env.example` to `.env.local` if the latter does not already exist. Preserve any existing credentials.
2. Set `META_API_KEY` to your authorized Meta Model API key.
3. Keep the default model IDs unless your project requires other available versions.
4. Restart the development server.
5. Open **Agent → Models & vision**. Run **Test text connection** for Spark and Wonder. This makes a small billed inference request and verifies text access only.
6. Load the demo image, keep **Simulated scene** selected, choose **cooling towers**, and run visual inspection to verify SAM and vision access. A text probe does not establish image capability.

```dotenv
META_API_KEY=your-key-here
META_MODEL=muse-spark-1.3
META_DEEP_MODEL=muse-wonder-1.0
META_VISION_MODEL=muse-spark-1.3
META_SAM_MODEL=sam-3.1
META_BASE_URL=https://api.meta.ai/v1
```

The server key is read from `META_API_KEY`; `.env.local` is ignored by version control. Visitors can instead paste their own key in the guided tour: it is kept in that browser's localStorage, sent to Elektron's own API routes as an `x-meta-key` header with that visitor's requests only, used for that request, and never stored or logged on the server. No `NEXT_PUBLIC_` key is used. The server-controlled endpoint override is useful for contract testing; browser requests cannot supply arbitrary provider URLs or model IDs.

## Demonstration sequence

1. Load **Playbook → inverter derating**. Ask Spark to explain the output drop. Show the measurement, peer, alarm and weather sources rather than reading an unsupported conclusion.
2. Select **Deep · Muse Wonder**. Explicitly ask to compare a 30-minute INV-07 outage with the current baseline. Show the isolated branch and its energy result. No physical command is issued.
3. Open **Models & vision**. Use an authorized field photograph or the clearly labeled rendered scene. SAM localizes the chosen objects; Spark interprets the same normalized image. Select a returned object to highlight its mask and box. Export the image review report.
4. Return to the investigation and download a shift handover. Distinguish simulated telemetry, model interpretations and operator-supplied visual context.

Visual review is independent of telemetry. It does not automatically associate a photo with a plant, change the simulation, detect calibrated shading loss, diagnose damage or convert a pixel mask into power generation. The source label is supplied by the operator, not verified by a model. A model match is not a confirmed physical equipment count; a zero-match result does not establish absence.

## Contracts and limits

- `GET /api/agent`: public model IDs and configured state only. Configuration is not verified inference.
- `POST /api/agent`: frozen `question`, `minute`, `scenario`, `siteId`, and `analysisMode` (`triage` or `deep`). Uses Meta Responses, stateless encrypted reasoning replay (`summary: []` when omitted), validated function arguments and evidence citations. Up to 7 rounds / 18 tools; deadlines 60 seconds for quick and 110 seconds for deep. Citation validation checks references, not the truth of every sentence.
- `POST /api/meta/check`: explicit text probe for a server-approved model profile. Returns success only after a completed response containing text. Deadline 30 seconds.
- `POST /api/inspection`: local base64 JPEG/PNG/WebP, selected target and source label. Raw image at most 4 MB / 20 megapixels. Server auto-orients, strips metadata and scales to at most 1600×1600 before sending to both models. Deadline 110 seconds. No arbitrary remote-image URLs are accepted.
- SAM uses streamed Responses with `metadata.mask_encoding: "one_bit"` and `metadata.include_confidence: "true"`; official `@meta-sam/parser` decodes masks. Stream and mask bounds are limited. Incomplete/malformed streams fail explicitly. Show at most 40 object overlays and report the total returned matches.
- A failed visual interpretation can return successful SAM localization with a visible partial-result notice and `vision: null`. No fabricated interpretation or placeholder detections are substituted.
- Images and inspection results are held in memory; the application does not persist uploaded photos. Images leave the browser only on **Run visual inspection** and are sent to Meta through the server with `store: false`. Provider account/service policies still apply.
- The no-key operations path remains explicitly scripted. Visual inference and connection checks require a key. Cancellation discards late responses; provider errors do not reveal keys or raw provider error bodies.
- This remains a local prototype. Before public multi-user deployment, add authentication, per-user usage quotas and deployment-appropriate request/concurrency limits. Existing time/tool/image bounds are not an account authorization system.

## Verification

Automated tests exercise Spark/Wonder routing, usage aggregation, encrypted reasoning replay, key-free behavior, successful text probes, provider access failures, real SAM wire-format decoding across split network chunks, mask placement, zero matches, malformed/incomplete responses, image limits, partial vision failure and cancellation. Provider responses in these tests are mocked; the masks use the Meta parser's documented wire fixture. Real account/model access and live inference require the supplied API key and remain unverified until the above checks pass.

## Primary references

- [Meta model availability](https://dev.meta.ai/docs/models)
- [Responses API and reasoning replay](https://dev.meta.ai/docs/protocols/responses)
- [Image understanding](https://dev.meta.ai/docs/image-understanding)
- [SAM overview](https://dev.meta.ai/docs/sam/overview)
- [SAM prompts, confidence and mask encodings](https://dev.meta.ai/docs/sam/segmenting)
- [Official SAM client libraries](https://dev.meta.ai/docs/sam/client-libraries)
