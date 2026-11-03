# Elektron

**Elektron is an AI assistant for solar, wind and geothermal power plants. When a plant suddenly makes less electricity, it finds out why, shows you the proof, and tests the fix before anyone is sent out.**

![Elektron: a wind turbine from the launch film](public/story/v4/film-poster.webp)

In short:

- **The problem:** a drop in power can mean broken equipment, bad weather, or a sensor that stopped working. They look the same on a chart, so crews often drive out for nothing.
- **What Elektron does:** it checks the weather, nearby equipment and alarm logs, tells you the real cause, and links every claim to its data.
- **How:** it uses Meta's **Muse** AI models, with a 3D model of the plant so you can see exactly where the problem is.

**Official entry · Meta Global AI Developer Hackathon** · Built with **Muse Code**, Meta's coding agent

| | |
| --- | --- |
| **Try the demo** | https://elektron-eight-sigma.vercel.app/workspace (a 2-minute guided tour starts automatically) |
| **Watch the film** (2:22) | https://www.youtube.com/watch?v=tz4qZuuWT8I |
| **Project page** | https://elektron-eight-sigma.vercel.app |

---

## The problem, in plain words

Solar, wind and geothermal plants report how much electricity they make, all day long. Sometimes one part of a plant suddenly makes much less than it should.

There are three very different reasons that can happen:

| What happened | What it means | What you should do |
| --- | --- | --- |
| A machine is failing | Something is actually broken | Send a crew |
| A cloud or rain passed over | Nothing is wrong, it's just the weather | Wait |
| A sensor stopped reporting | The machine may be fine; the data is missing | Check the data first |

On a chart, **all three look exactly the same**. Engineers have to dig through weather data, nearby equipment and alarm logs to tell them apart. Guess wrong, and a crew drives for hours to a site where nothing is broken.

## What Elektron does

Elektron does that detective work for you, and shows its reasoning.

1. **It spots the drop.** A dashboard watches eight plants and flags the one that's falling behind.
2. **It shows you where.** A 3D model of the plant highlights the exact piece of equipment.
3. **It explains why.** You ask "why?", and Elektron uses Meta's **Muse** AI to check what an engineer would: the neighboring equipment, the weather and the alarm log.
4. **It proves it.** Every claim links to the exact data behind it, so you can check it yourself.
5. **It tests the fix first.** It tries the repair on a *copy* of the plant, so you know the cost before anyone gets in the truck.
6. **It hands over.** The answer, the evidence and the test go into a shift report for the next engineer.

### An example from the demo

> Inverter **INV-07** at Silangan Solar is making **322 kW** when today's sunshine says it should make about **699 kW**.
> Elektron checks its neighbors (normal), the weather (clear) and the alarm log (a heat warning), and concludes: **it overheated and turned itself down.** Letting it cool for 30 minutes costs **0.156 MWh**, tested on a copy, with the real plant untouched.

It also recognizes the drops that **aren't** problems: rain, a quiet sensor (shown as "unknown", not zero), and an incoming typhoon.

## Try it in two minutes

1. Open the [demo](https://elektron-eight-sigma.vercel.app/workspace).
2. Follow the guided tour. You don't need to know anything about power plants.
3. When asked, paste a Meta API key to see Muse answer live, or choose **Continue with simulated data**.
4. Afterwards, click **Ask Elektron** in the top right and ask your own question.

## Is any of this real?

- **The problem and the know-how are real.** We work with electrical engineers and solar, wind and geothermal plants in the Philippines, and we have used Elektron on real plants.
- **The data in this demo is simulated.** For the hackathon, this is a prototype rebuilt on Meta's models. To keep plant data confidential, it runs on a simulated recreation: the company, the sites and the readings are fictional, and no real plant is connected.
- **The AI never controls equipment.** It can only read data and explain. Every number comes from a separate calculation engine, not from the AI.

## How it uses Meta's AI

| Meta model | What it does in Elektron |
| --- | --- |
| **Muse Spark** | Investigates a drop step by step using 13 read-only tools, and cites its evidence |
| **Muse Wonder** | Thinks longer for harder questions, including "what if we try this fix?" |
| **SAM 3.1** (with Muse Spark) | Finds and outlines equipment in photos of a plant |
| **Muse Code** | The coding agent we used to build Elektron |

Without a Meta API key, the demo still works: it runs a clearly labeled scripted version of the same investigation on the same data.

## A few terms

| Term | Meaning |
| --- | --- |
| **Inverter** | The box that turns solar panel power into electricity the grid can use |
| **kW / MW** | How much power something is making right now (1 MW = 1,000 kW) |
| **MWh** | An amount of energy: power over time |
| **3D twin** | An interactive 3D copy of a real plant you can explore and click |
| **What-if** | A test run on a copy of the plant, so nothing real changes |

## Who built it

- **Bryl Lim**

## For developers

```sh
npm install
npm run dev        # open http://localhost:3000
npm test           # 59 tests
npm run build
```

To use the real Muse models, paste your Meta API key in the guided tour (it stays in your browser and is sent only with your own requests), or copy `.env.example` to `.env.local` and set `META_API_KEY` on the server.

**Built with:** Muse Code, Next.js, React, Three.js, the Meta Model API, and 3D models from NVIDIA SimReady, Poly Haven, Innerscene and Grab3D.

**More detail:**
- [How the simulation works](docs/SIMULATION.md)
- [Meta model setup](docs/META_SETUP.md) and [integration notes](public/story/meta-integration.md)
- [3D asset sources and licenses](docs/ASSETS.md)
- [Demo script](docs/DEMO.md)
