"""Fetch pinned NVIDIA USD dependencies and metadata for the browser asset build."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
REVISION = '4763fbfaa4f8e97658e68b57d01b4c86659e08b5'
ASSETS = ['barrier_fence_metal_a02', 'electrical_power_terminal_a01']
BASE = f'https://huggingface.co/datasets/nvidia/simready-assets/resolve/{REVISION}/'
DEST = ROOT / 'simulation/assets'

def fetch(path):
    target = DEST / path
    if target.exists():
        return path, target.stat().st_size
    target.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(BASE + path, timeout=45) as response:
                data = response.read()
            target.write_bytes(data)
            return path, len(data)
        except Exception:
            if attempt == 3: raise
            time.sleep(1 + attempt)

def main():
    paths = []
    for asset in ASSETS:
        url = f'https://huggingface.co/api/datasets/nvidia/simready-assets/tree/{REVISION}/{asset}?recursive=true&limit=1000'
        with urllib.request.urlopen(url, timeout=30) as response:
            files = json.load(response)
        # Keep canonical USD layers and provenance. Texture dependencies are fetched by the converter.
        paths.extend(f['path'] for f in files if f['type'] == 'file' and (
            f['path'].endswith(('.usd', '.usda', '.json', 'LICENSE.txt')) and '/.thumbs/' not in f['path'] and '/source_assets/' not in f['path']))
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for i, (path, size) in enumerate(pool.map(fetch, paths)):
            print(f'{i+1}/{len(paths)} {path} ({size:,} bytes)', flush=True)
    records = [{ 'path': p, 'sha256': hashlib.sha256((DEST/p).read_bytes()).hexdigest() } for p in sorted(paths)]
    (DEST/'source-lock.json').write_text(json.dumps({'repository':'nvidia/simready-assets','revision':REVISION,'files':records}, indent=2)+'\n')

if __name__ == '__main__': main()
