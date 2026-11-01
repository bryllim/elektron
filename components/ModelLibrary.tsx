"use client";
import { Component, Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Html, OrbitControls, Environment } from "@react-three/drei";
import { Box, ExternalLink } from "lucide-react";
import { MODEL_CATALOG } from "@/lib/model-catalog";
import { SourcedInstances } from "./SourcedModels";
class PreviewBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className="model-preview-error">Preview unavailable. You can still view the original source below.</p> : this.props.children; }
}
export default function ModelLibrary() {
  const [id, setId] = useState<string>("tree");
  const model = MODEL_CATALOG.find(m => m.id === id)!;
  return <div className="model-library">
    <header><span className="eyebrow">SOURCE LIBRARY / {MODEL_CATALOG.length} ASSETS</span><h2>Real assets. Traceable origins.</h2><p>Inspect the models used in the plant. Drag to orbit, scroll to zoom.</p></header>
    <div className="model-library-body">
      <div className="model-library-list" aria-label="Sourced 3D models">{MODEL_CATALOG.map(m=><button key={m.id} aria-pressed={m.id===id} onClick={()=>setId(m.id)}><Box size={15}/><span>{m.name}<small>{m.provider}</small></span></button>)}</div>
      <div className="model-library-detail">
        <div className="model-preview" aria-label={`Interactive preview of ${model.name}`}>
          <PreviewBoundary key={id}><Canvas frameloop="demand" dpr={[1,1.5]} camera={{position:[5,3,6],fov:40}}>
            <color attach="background" args={["#101315"]}/><ambientLight intensity={1.3}/><hemisphereLight args={["#dce6ec","#3c403a",1.8]}/><directionalLight position={[5,8,5]} intensity={3}/><directionalLight position={[-4,2,-3]} intensity={1}/>
            <Suspense fallback={<Html center><span className="model-loading">Loading source model…</span></Html>}><Environment files="/environments/studio_small_09_1k.hdr" environmentIntensity={1.1}/><Bounds fit clip observe margin={1.15}><SourcedInstances path={model.path} select={"select" in model ? model.select : ""}/></Bounds></Suspense>
            <OrbitControls makeDefault enableDamping={false}/>
          </Canvas></PreviewBoundary>
          <span className="model-license">{model.license} · SOURCED ASSET</span>
        </div>
        <div className="model-source-detail"><h3>{model.name}</h3><p>{model.detail}</p><a href={model.source} target="_blank" rel="noreferrer">View original source <ExternalLink size={13}/></a></div>
      </div>
    </div>
    <p className="model-library-note">Browser conversions retain source geometry and materials. Equipment layout and counts are illustrative; model imports do not add electrical or thermal physics. Powered by <a href="https://polyhaven.com" target="_blank" rel="noreferrer">Poly Haven</a>.</p>
  </div>;
}
