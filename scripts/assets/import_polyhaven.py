"""Download licensed Poly Haven originals and record their file hashes."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[2]
DEST=ROOT/'simulation/assets/polyhaven'
NAMES=['island_tree_01','modular_chainlink_fence','modular_electricity_poles','rock_moss_set_01','fern_02']

def get(url,path):
 path.parent.mkdir(parents=True,exist_ok=True)
 if path.exists(): return
 subprocess.run(['curl','--fail','--silent','--show-error','--location','--retry','3','--max-time','120','--user-agent','ElektronAssetImporter/1.0',url,'--output',str(path)+'.part'],check=True)
 Path(str(path)+'.part').rename(path)

def main():
 records=[]
 for name in NAMES:
  folder=DEST/name
  get('https://api.polyhaven.com/files/'+name,folder/'files.json')
  get('https://api.polyhaven.com/info/'+name,folder/'info.json')
  data=json.loads((folder/'files.json').read_text())['gltf']['1k']['gltf']
  files={name+'.gltf':data,**data['include']}
  with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
   list(pool.map(lambda pair:get(pair[1]['url'],folder/pair[0]),files.items()))
  for p,info in files.items():
   raw=(folder/p).read_bytes()
   if hashlib.md5(raw).hexdigest()!=info['md5']: raise ValueError('MD5 mismatch: '+p)
   records.append({'asset':name,'path':p,'url':info['url'],'sha256':hashlib.sha256(raw).hexdigest()})
  print(name,'downloaded',sum((folder/p).stat().st_size for p in files),flush=True)
 (DEST/'source-lock.json').write_text(json.dumps(records,indent=2)+'\n')

if __name__=='__main__': main()

# Reflection lighting is served locally; the visual background stays dark.
if __name__ == '__main__':
    get('https://api.polyhaven.com/files/studio_small_09', DEST/'studio_small_09/files.json')
    data=json.loads((DEST/'studio_small_09/files.json').read_text())['hdri']['1k']['hdr']
    target=ROOT/'public/environments/studio_small_09_1k.hdr'
    get(data['url'],target)
    if hashlib.md5(target.read_bytes()).hexdigest()!=data['md5']: raise ValueError('HDRI hash mismatch')
