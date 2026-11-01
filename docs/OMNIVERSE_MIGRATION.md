# NVIDIA assets and optional simulation runtime

## Current implementation

The browser now renders actual NVIDIA SimReady-origin safety barrier and electrical power terminal geometry, converted from pinned USD packages into GLB. It also uses sourced Poly Haven, Innerscene and Grab3D models. See [asset sources and conversion details](ASSETS.md).

**No RTX workstation is needed to view these models.** Three.js renders the GLB assets on the current Mac/browser. This meets the asset-import request without provisioning a GPU server or replacing the web interface.

NVIDIA physics metadata, MDL and runtime behavior are not carried by the browser conversion. These are visual assets, not a connected Omniverse physics simulation. No suitable solar module/inverter was identified by name in NVIDIA's reviewed catalog; sourced solar models and inverter CAD are used instead.

## Physical behavior priority

The user selected **solar output, shading, and inverter temperature**. Existing dashboard telemetry remains the deterministic demonstration described in [SIMULATION.md](SIMULATION.md). It has a simplified irradiance/temperature/output relationship and a seeded derating event. Visual mesh shadows do not yet reduce electrical output, and inverter temperature does not yet use a transient heat-balance solver.

A physical-model upgrade would need a shared sun-position model, occlusion sampling against the imported geometry, irradiance/weather inputs, PV conversion parameters, inverter loss/thermal mass/cooling parameters, and validation against reference data. SimReady geometry alone does not supply those parameters. It is possible to develop a reduced-order model in the browser; selecting an NVIDIA runtime is a separate decision, not a prerequisite for these asset imports.

[SimReady physics scope](https://docs.omniverse.nvidia.com/simready/latest/sim-needs/phys-and-behaviors.html) · [OpenUSD physics schema](https://openusd.org/release/api/usd_physics_page_front.html)

## Optional future NVIDIA runtime

For a future native OpenUSD/PhysX workflow, retain source USD assets and run an appropriate Omniverse/Isaac Sim host, stream its viewport to the React interface, and exchange time-stamped simulation measurements. Choose that runtime only when its capabilities match the required behavior. No GPU service has been provisioned and no runtime endpoint is configured.

[Omniverse streaming workflow](https://docs.omniverse.nvidia.com/kit/docs/kit-app-template/latest/docs/streaming.html) · [Web SDK](https://docs.omniverse.nvidia.com/ov-web-sdk/latest/index.html)
