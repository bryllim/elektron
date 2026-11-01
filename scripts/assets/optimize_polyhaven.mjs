import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {weld,simplify,dedup,prune,textureCompress} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;
await fs.mkdir('public/models/polyhaven',{recursive:true});
for(const name of process.argv.slice(2)){
 const doc=await io.read(`simulation/assets/polyhaven/${name}/${name}.gltf`);
 console.log(name,doc.getRoot().listNodes().map(n=>n.getName()));
 const triangles=()=>doc.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0),0);
 const before=triangles();
 if(name==='island_tree_01') await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:0.15,error:0.005}));
 await doc.transform(dedup(),prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:85}));
 doc.getRoot().getAsset().copyright='Poly Haven contributors — CC0';
 doc.getRoot().setExtras({source:`https://polyhaven.com/a/${name}`,originalTriangles:before,triangles:triangles(),changes:'Textures resized to 1024px WebP; tree mesh simplified for repeated browser rendering; original UVs/materials retained.'});
 await io.write(`public/models/polyhaven/${name}.glb`,doc);
 console.log(name, 'triangles',before,'->',triangles());
}
