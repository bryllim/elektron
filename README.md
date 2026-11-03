# Elektron

**When a power plant's output drops, know why before the truck rolls.**

A solar inverter suddenly makes half its usual power. Is the inverter failing? Did a cloud pass over? Or did a sensor stop reporting? On a chart, all three look the same. Guess wrong and a maintenance crew drives hours to a site where nothing is broken.

Elektron answers that question. It uses **Muse**, Meta's AI models, to check what an engineer would check, explain the cause with evidence you can click, and test a fix on a copy of the plant before anyone is sent out.

**Official entry · Meta Global AI Developer Hackathon** · Built with **Muse Code**, Meta's coding agent

- **Try it:** https://elektron-eight-sigma.vercel.app/workspace (a guided tour starts automatically)
- **Project page:** https://elektron-eight-sigma.vercel.app
- **Film (2:22):** https://www.youtube.com/watch?v=tz4qZuuWT8I

> **Prototype on simulated data.** We work with electrical engineers and solar, wind and geothermal power plants in the Philippines, and we have used Elektron on real plants. For the hackathon, this is a prototype rebuilt on Meta's models, and to keep plant data confidential it runs on a simulated recreation: the company, sites and readings are fictional, and no real plant is connected.

## How it works

1. **Spot the drop.** The fleet view flags a solar plant where inverter INV-07 makes 322 kW instead of the expected 699 kW.
2. **See it on site.** A 3D model of the plant highlights INV-07. It's running hot (74.3 °C) and has cut its own output.
3. **Ask Muse why.** Muse looks up the neighboring inverters, the weather and the alarm log, then explains the cause. Every claim links to the data behind it.
4. **Test the fix.** A "what-if" compares a 30-minute shutdown with doing nothing (it costs 0.156 MWh), on a copy, without touching live data.
5. **Hand it over.** The answer, the evidence and the test go into a shift report for the next engineer.

It also handles drops that aren't faults: rain, a sensor that goes quiet (shown as "unknown", not zero), and typhoons.

## Meta models used

| Model | What it does here |
| --- | --- |
| **Muse Spark** | Investigates the drop using 13 read-only tools and cites its evidence |
| **Muse Wonder** | Deeper analysis, including what-if comparisons |
| **SAM 3.1** (with Muse Spark) | Finds and outlines equipment in photos of a plant |

The AI explains. A separate calculation engine produces every number, and the AI has no way to control equipment. Without an API key, the app runs a clearly labeled scripted version of the same investigation.

## Run it locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. To use the real Muse models, either paste your Meta API key in the guided tour (it stays in your browser and is sent only with your own requests), or copy `.env.example` to `.env.local` and set `META_API_KEY` on the server.

```sh
npm test          # 59 tests
npm run build
```

## Built with

We built Elektron with **Muse Code**, Meta's coding agent. The app uses Next.js, React, Three.js, the Meta Model API (Muse Spark, Muse Wonder, SAM 3.1), and 3D models from NVIDIA SimReady, Poly Haven, Innerscene and Grab3D.

## More detail

- [How the simulation works](docs/SIMULATION.md)
- [Meta model setup](docs/META_SETUP.md) and [integration notes](public/story/meta-integration.md)
- [3D asset sources and licenses](docs/ASSETS.md)
- [Demo script](docs/DEMO.md)
