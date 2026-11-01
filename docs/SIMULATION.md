# Simulation assumptions

All data is synthetic. The single clock is a local minute of October 30, 2026, displayed in Asia/Manila, stored as an ISO UTC timestamp. The engine uses deterministic trigonometric functions and explicit seeded incidents; widgets do not sample random values. Calling the same model with the same site, timestamp, and scenario produces the same reading.

## Solar

Solar daylight is `max(0, sin(pi × (minute − 360) / 720))`: a deliberately simplified 06:00–18:00 daylight window, not an astronomical solar-position model.

Synthetic plane-of-array irradiance is `(910 + 8 × siteIndex) × daylight × cloudTransmission × exp(−0.012 × rainfall)` in W/m². It is directly modeled POA; no measured GHI conversion is claimed.

For each solar capacity block:

1. Ambient temperature: `25 + 7 × daylight − (rainfall > 0 ? 3 : 0)` °C.
2. Cell temperature: `ambient + 0.028 × irradiance` °C.
3. Temperature multiplier: `max(0.7, 1 − 0.0035 × (cellTemperature − 25))`.
4. Expected AC output: `min(AC rating, DC MWp × irradiance / 1000 × temperatureMultiplier × 0.96 × 0.98)` MW. The 0.96 term is conversion efficiency; 0.98 is a fixed modeled pre-export loss factor.
5. Silangan actual baseline ratio: `0.987 + 0.009 × sin(assetIndex × 2.7 + minute / 180)`; this varies between 97.8% and 99.6% of modeled expectation.
6. Net export: `max(0, actual × 0.982 − 0.025)` MW while generation is positive. The extra 1.8% is collection/export loss, and 0.025 MW is site auxiliary load. Nighttime modeled export is zero.

Silangan's twelve inverters each have 1 MWp DC and 10/12 MW AC. Two groups contain six inverters each. Sourced scene rows are representative geometry; their physical panel count is not a manufacturing bill of materials.

Other solar sites use the same temperature/irradiance formula with their configured DC and AC capacities and a 99% actual-to-expected ratio.

## Secondary technologies

- Wind expected power is AC rating × a generic power curve: zero at/below 3 m/s and at/above 25 m/s, `(v³ − 3³) / (12³ − 3³)` between 3 and 12 m/s, and rated output from 12 to below 25 m/s. Actual power is 98.5% of expected. Rotor motion uses the same cut-in and cut-out thresholds. This is not a manufacturer curve or an aeroelastic solver.
- Geothermal is 94% expected utilization with a 99% actual-to-expected multiplier.
- Hydro is 71%–81% expected utilization with a 99% actual-to-expected multiplier. It cannot exceed its 16 MW rating. No reservoir or hydraulic dynamics are represented.
- Storage dispatch is `2.8 × sin((minute − 720) / 180)` MW. SOC is `50 + 26.25 × cos((minute − 720) / 180)` percent for 32 MWh. This has a derivative consistent with dispatch under a lossless simplified cycle and remains bounded (23.75%–76.25%). Positive power is discharge. Storage is not counted as generation.

## Energy, gaps, and fleet aggregation

Energy uses trapezoidal integration of MW over hours, yielding MWh. Daily and historical totals use at most 5-minute steps. Branches use 1-minute steps. This is numerically approximate, not revenue-grade metering.

If either endpoint of an integration step is missing, the full interval is excluded and recorded as missing minutes. Such totals are partial and must not be interpreted as complete. Unknown instantaneous site output makes the full fleet generation/export total unknown; known partial generation remains available internally for inspection. Missing readings are never converted to confirmed zero output. No interpolation across missing gaps occurs.

Fleet generation sums generators only; fleet net export includes the signed storage dispatch. Instantaneous utilization is power divided by installed AC rating; it is not a period capacity factor. No financial, carbon, or emissions figures are generated.

## Reproducible scenarios

- **Normal:** baseline daylight/weather and peer variation.
- **Cloud passage:** between 13:00 and 14:00, the POA multiplier decreases by up to 58% following a sine-shaped passage across all solar zones.
- **Inverter derating:** at 13:15, INV-07 changes to 46% of expected output and reports 74.3 °C with a thermal derating controller event. Its underlying cooling root cause remains unknown to the investigator.
- **Telemetry interruption:** at 13:00, INV-04 stops reporting. Its last timestamp is 12:59. The actual physical output is unknown; the scenario is not proof of inverter failure.
- **Typhoon exposure:** a fictional map track and synthetic rainfall provide an exposure demonstration. Neither distance nor this model establishes safety. No official warning or real weather service is connected.

## What-if branches

An outage removes the chosen inverter's modeled actual output for the chosen duration. Reduced irradiance scales plant AC output linearly while holding temperature and efficiency constant. No other assets compensate. Existing scenario conditions and synthetic weather continue across the interval. The calculations allocate separate branch arrays and never mutate baseline readings.

These branches omit controller transients, dispatch strategy, thermal feedback, reactive power, grid protection, and component engineering behavior. Results are educational estimates, not validated forecasts or operational instructions.

## 3D simulation limits

The interactive scene is real WebGL geometry with instancing, raycast selection, orbit controls, and telemetry-driven visual state. It represents the configured assets and performance model. It is not a certified electrical, electromagnetic, thermal, fluid, or multiphysics solver. Equipment and environment props now use sourced models, including NVIDIA SimReady-origin geometry. The inverter inspection view separates 26 imported Innerscene CAD parts with illustrative offsets. Neither those assets nor their displayed scale/counted instances are calibrated equipment specifications. Visual shadows are not yet coupled to electrical output, and the derating temperature remains a seeded demonstration value.

### Linked weather and terrain

The weather selector changes the shared fleet scenario while preserving the selected time and pausing replay. Meters, charts, energy totals, exports, agent evidence, rotor motion, rain, fog and lighting all read that scenario. A selection replaces the previous scenario (including any seeded fault) and applies to the whole replay window; it does not append a historical weather event.

| Weather scenario  |      Cloud transmission |             Rain (mm/h) |                                  Wind (m/s) |
| ----------------- | ----------------------: | ----------------------: | ------------------------------------------: |
| Clear             |                       1 |                       0 |                     Baseline site variation |
| Overcast          |                    0.42 |                       0 |                     Baseline site variation |
| Rain showers      |                    0.38 |                       6 |                                           8 |
| Calm              |                       1 |                       0 |                                         1.5 |
| Strong wind       |                       1 |                       0 |                                          12 |
| Heavy rain & wind |                    0.24 |                      18 |                                          19 |
| Typhoon exposure  | Location/time dependent | Location/time dependent | Moving storm field; turbines park at 25 m/s |

Cloud and rain transmission multiply irradiance before the solar temperature and conversion model. Rain attenuation and ambient cooling are synthetic assumptions, not a calibrated precipitation model. Geothermal output stays steady; rainfall does not arbitrarily reduce geothermal generation. No live weather service is connected.

The model follows the general irradiance/temperature relationship described in [Sandia's PVWatts overview](https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/point-value-models/pvwatts/) and the rated-power/cut-out behavior described by the [US Department of Energy](https://www.energy.gov/cmei/wind/articles/how-do-wind-turbines-survive-severe-weather-and-storms). Thresholds here are illustrative, not turbine specifications; this app does not run PVWatts itself.

Amihan and Habagat render sourced wind turbine geometry with selectable units. Bukal renders sourced cooling towers and heat exchangers with wind-drifted cooling vapor and a logical process route. Counts and layouts are representative. Mountain ridges surround flat equipment pads; sourced trees are grounded to the terrain surface. The landscape is generated geography, not surveyed elevation data.

Rain animates in 3D with wind drift; wet ground, fog and reduced lighting follow the scenario. Interface pause and system reduced-motion preferences stop rotor, rain and vapor animation without changing calculated output.

### Synthetic satellite and typhoon replay

SIM-01 is a deterministic fictional cyclone moving west-northwest from 131° E, 12.8° N to 120° E, 18.3° N across the replay day. The profile varies from 39–46 m/s peak wind and 955–970 hPa central pressure. Those parameters are illustrative; no storm category or official advisory is inferred.

A radial eyewall, declining wind envelope and spiral cloud bands produce site-specific wind, precipitation and cloud transmission. Cloud transmission and rain attenuation feed the existing PV model. Local wind feeds the turbine curve and cut-out behavior. The storm no longer shuts every wind farm down simultaneously. Sub-0.1 mm/h rainfall is treated as dry in the scene. Geothermal, hydro and storage keep their existing models; flood and infrastructure damage are not modeled.

The map's generated raster is a simulated satellite product, not downloaded imagery: infrared-style brightness temperature is `24 − 98 × cloudFraction` °C; the alternate band displays the same modeled surface wind field. Display texture adds only visual grain, not measurement noise. Frames and the displayed storm center use a 15-minute cadence, while plant measurements follow the current replay time. The nominal 280 km dashed ring is a visual reference, not a warning boundary or uncertainty cone. Solid track is elapsed replay; dashed track is the remainder of the fictional scenario.

The fleet's **Typhoon simulation** control opens the satellite/exposure console. Frame buttons pause playback and move the shared clock; the existing playback controls animate the entire scenario. All displays label the data synthetic or simulated. No satellite provider, live weather API, real observation, or forecast is represented.
