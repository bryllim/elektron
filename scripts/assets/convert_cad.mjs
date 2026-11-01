/** Tessellate third-party CC0 STEP originals; do not synthesize replacement geometry. */
import occtInit from 'occt-import-js';
import {Document, NodeIO} from '@gltf-transform/core';
import {dedup, join, prune, weld} from '@gltf-transform/functions';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const occt=await occtInit();
const out='public/models/innerscene'; await fs.mkdir(out,{recursive:true});
const reports=[];
for(const name of ['solar-panel','wall-inverter','transformer','switchboard','container']){
 const path=`simulation/assets/innerscene/${name}.step`;
 let raw; try {raw=await fs.readFile(path);} catch {continue;}
 const data=occt.ReadStepFile(raw,{linearUnit:'meter',linearDeflectionType:'absolute_value',linearDeflection:0.0003,angularDeflection:0.2});
 if(!data.success) throw Error(`STEP import failed: ${name}`);
 const doc=new Document(); const buffer=doc.createBuffer(); const scene=doc.createScene(name);
 doc.getRoot().getAsset().copyright='Innerscene Corp — CC0 1.0';
 doc.getRoot().setExtras({source:name,sourceSha256:createHash('sha256').update(raw).digest('hex'),changes:'STEP tessellated at 0.3 mm; Z-up converted to Y-up; grounded center; original colors retained; mesh batches merged by material.'});
 const low=[Infinity,Infinity,Infinity], high=[-Infinity,-Infinity,-Infinity];
 for(const m of data.meshes) {
  const a=m.attributes.position.array;
  for(let i=0;i<a.length;i+=3){const p=[a[i],a[i+2],-a[i+1]]; for(let j=0;j<3;j++){low[j]=Math.min(low[j],p[j]);high[j]=Math.max(high[j],p[j]);}}
 }
 const origin=[(low[0]+high[0])/2,low[1],(low[2]+high[2])/2];
 let triangles=0;
 for(const m of data.meshes){
  const array=m.attributes.position.array; const points=new Float32Array(array.length);
  const normals=m.attributes.normal?.array; const normal=normals?new Float32Array(normals.length):null;
  for(let i=0;i<array.length;i+=3){points.set([array[i]-origin[0],array[i+2]-origin[1],-array[i+1]-origin[2]],i);if(normal) normal.set([normals[i],normals[i+2],-normals[i+1]],i);}
  const metal=/aluminium|hinge|fin|heat|mounting|rail|handle|chassis|formed|frame|perimeter/.test(m.name.toLowerCase());
  const mat=doc.createMaterial(m.name).setBaseColorFactor([...(m.color??[0.5,0.5,0.5]),1]).setMetallicFactor(metal?0.65:0.05).setRoughnessFactor(/cell|display|glass/.test(m.name)?0.28:0.5);
  const prim=doc.createPrimitive().setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(points).setBuffer(buffer))
   .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(m.index.array)).setBuffer(buffer)).setMaterial(mat);
  if(normal) prim.setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(normal).setBuffer(buffer));
  scene.addChild(doc.createNode(m.name).setMesh(doc.createMesh(m.name).addPrimitive(prim)));
  triangles+=m.index.array.length/3;
 }
 if(name === "wall-inverter") await new NodeIO().write(`${out}/wall-inverter-parts.glb`,doc);
 await doc.transform(dedup(),join(),weld(),prune());
 await new NodeIO().write(`${out}/${name}.glb`,doc);
 const report={id:name,dimensionsMeters:high.map((n,i)=>n-low[i]),triangles,sourceMeshes:data.meshes.length,meshes:doc.getRoot().listMeshes().length,sha256:createHash('sha256').update(await fs.readFile(`${out}/${name}.glb`)).digest('hex')};
 reports.push(report);console.log(report);
}
await fs.writeFile(`${out}/manifest.json`,JSON.stringify({creator:'Innerscene Corp',license:'CC0-1.0',assets:reports},null,2));
