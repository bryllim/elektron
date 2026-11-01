import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {weld,simplify,dedup,join,prune,textureCompress} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;
const rawDir='simulation/assets/converted/nvidia';
const manifest=JSON.parse(await fs.readFile(`${rawDir}/manifest.json`));
await fs.mkdir('public/models/nvidia',{recursive:true});
for(const record of manifest.assets){
  const doc=await io.read(`${rawDir}/${record.file}`);
  await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:0.4,error:0.0005}),dedup(),prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:88}));
  const path=`public/models/nvidia/${record.file}`;
  await io.write(path,doc);
  const bytes=await fs.readFile(path);record.bytes=bytes.length;record.sha256=createHash('sha256').update(bytes).digest('hex');
  record.triangles=doc.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((n,p)=>n+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0),0);
}
manifest.changes='USD render meshes converted to grounded Y-up metres; PBR approximated; geometry simplified with 0.0005 relative error bound; 1K WebP textures; physics and MDL omitted.';
await fs.writeFile('public/models/nvidia/manifest.json',JSON.stringify(manifest,null,2)+'\n');
await fs.copyFile(`${rawDir}/LICENSE.txt`,'public/models/nvidia/LICENSE.txt');
await fs.mkdir('public/models/grab3d',{recursive:true});
const solar=await io.read('simulation/assets/grab3d/solar-panel.glb');
await solar.transform(dedup(),join(),weld(),prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:88}));
await io.write('public/models/grab3d/solar-panel.glb',solar);
for(const file of ['LICENSE.txt','manifest.json'])await fs.copyFile(`simulation/assets/grab3d/${file}`,`public/models/grab3d/${file}`);
console.log('Optimized NVIDIA and Grab3D assets.');
