import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sources = {
  'solar-panel': 'solar-panel-compact-original-mep-cad-9beeba1e',
  'wall-inverter': 'wall-inverter-original-mep-cad-819279d7',
  transformer: 'pad-mount-transformer-original-mep-cad-97ec95a3',
  switchboard: 'switchboard-original-mep-cad-15071089',
  container: '40-ft-standard-shipping-container-5f94ec90',
};
await fs.mkdir('simulation/assets/innerscene',{recursive:true});
await fs.mkdir('simulation/assets/grab3d',{recursive:true});
const records=[];
async function download(url,path){
  let bytes;
  try { bytes=await fs.readFile(path); } catch {
    const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
    if(!response.ok) throw Error(`${response.status}: ${url}`);
    bytes=Buffer.from(await response.arrayBuffer());
    await fs.writeFile(path,bytes);
  }
  records.push({url,path,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await Promise.all(Object.entries(sources).map(([name,slug])=>download(`https://www.innerscene.com/api/library/${slug}/download`,`simulation/assets/innerscene/${name}.step`)));
await Promise.all(['solar-panel.glb','LICENSE.txt','manifest.json'].map(name=>download(`https://grab3d.com/dl/solar-panel/${name}`,`simulation/assets/grab3d/${name}`)));
await fs.mkdir('public/models/innerscene',{recursive:true});
await fs.writeFile('public/models/innerscene/source-lock.json',JSON.stringify(records,null,2)+'\n');
console.log('Source downloads and hashes verified.');
