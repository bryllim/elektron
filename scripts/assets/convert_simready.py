"""Build browser GLBs from pinned USD render meshes (not a physics conversion).
Run: uv run --python 3.12 --with usd-core --with numpy --with pillow python scripts/assets/convert_simready.py
"""
import concurrent.futures
import hashlib
import io
import json
from pathlib import Path
import re
import struct
import numpy as np
from PIL import Image
from pxr import Usd, UsdGeom, UsdShade
from import_simready import ASSETS, DEST, ROOT, REVISION, fetch

OUT = DEST / 'converted/nvidia'
OUT.mkdir(parents=True, exist_ok=True)


def convert(name):
    folder = DEST / name / 'simready_usd'
    # Canonical textures stay alongside USD; only embedded browser copies are resized.
    refs = set(re.findall(r'@\.\./(Textures/[^@]+)@', (folder/'payloads/materials.usda').read_text()))
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(fetch, [f'{name}/simready_usd/{p}' for p in sorted(refs)]))
    stage = Usd.Stage.Open(str(folder/f'sm_{name}_01.usd'))
    root = stage.GetDefaultPrim()
    for variant in ['PhysX', 'Newton', 'MuJoCo']:
        if root.GetVariantSet(variant): root.GetVariantSet(variant).SetVariantSelection('Disabled')
    meters = UsdGeom.GetStageMetersPerUnit(stage)
    zup = UsdGeom.GetStageUpAxis(stage) == 'Z'
    cache = UsdGeom.XformCache()
    meshes = [UsdGeom.Mesh(p) for p in Usd.PrimRange(stage.GetPseudoRoot(), Usd.TraverseInstanceProxies())
              if p.IsA(UsdGeom.Mesh) and UsdGeom.Imageable(p).ComputeVisibility() != 'invisible'
              and UsdGeom.Imageable(p).ComputePurpose() in ('default', 'render')]
    binary = bytearray()
    doc = {'asset': {'version':'2.0','generator':'Elektron USD render-mesh converter',
        'copyright':'NVIDIA — CC BY 4.0', 'extras': {'sourceRevision':REVISION,'sourceAsset':name,
        'changes':'USD to glTF; triangulation; metre/Y-up normalization; grounded center; textures resized to 1024px. Physics and MDL omitted.'}},
        'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[], 'materials':[],
        'buffers':[], 'bufferViews':[], 'accessors':[], 'images':[], 'textures':[],
        'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}]}
    def view(raw, target=None):
        while len(binary)%4: binary.append(0)
        i=len(doc['bufferViews']); v={'buffer':0,'byteOffset':len(binary),'byteLength':len(raw)}
        if target: v['target']=target
        doc['bufferViews'].append(v); binary.extend(raw); return i
    def accessor(data, kind):
        data=np.asarray(data,dtype='<f4')
        i=len(doc['accessors'])
        doc['accessors'].append({'bufferView':view(data.tobytes(),34962),'componentType':5126,
            'count':len(data),'type':kind,'min':data.min(axis=0).tolist(),'max':data.max(axis=0).tolist()})
        return i
    texture_cache={}
    def texture(shader, input_name):
        inp=shader.GetInput(input_name)
        source=inp.GetConnectedSource() if inp else None
        if not source: return None
        tex=UsdShade.Shader(source[0].GetPrim()); file=tex.GetInput('file')
        if not file or not file.Get(): return None
        path=Path(file.Get().resolvedPath)
        if not path.is_file(): raise ValueError(f'Unresolved texture {file.Get()}')
        if str(path) in texture_cache: return texture_cache[str(path)]
        im=Image.open(path).convert('RGB'); im.thumbnail((1024,1024),Image.Resampling.LANCZOS)
        data=io.BytesIO(); im.save(data,format='PNG',optimize=True)
        idx=len(doc['textures'])
        doc['images'].append({'bufferView':view(data.getvalue()),'mimeType':'image/png','name':path.name})
        doc['textures'].append({'sampler':0,'source':len(doc['images'])-1}); texture_cache[str(path)]=idx
        return idx
    material_cache={}
    def material(prim):
        mat=UsdShade.MaterialBindingAPI(prim).ComputeBoundMaterial()[0]
        key=mat.GetPrim().GetName() if mat else 'default'
        if key in material_cache: return material_cache[key]
        result={'name':key,'pbrMetallicRoughness':{'baseColorFactor':[0.65,0.65,0.65,1],'metallicFactor':0,'roughnessFactor':0.7}}
        shader=mat.ComputeSurfaceSource()[0] if mat else None
        if shader:
            def val(n,default):
                p=shader.GetInput(n); v=p.Get() if p else None
                return default if v is None else v
            color=val('diffuseColor',[1,1,1]); opacity=float(val('opacity',1))
            pbr=result['pbrMetallicRoughness']; pbr.update(baseColorFactor=[*map(float,color),opacity],metallicFactor=float(val('metallic',1)),roughnessFactor=float(val('roughness',1)))
            for slot,input_name in [('baseColorTexture','diffuseColor'),('metallicRoughnessTexture','roughness')]:
                t=texture(shader,input_name)
                if t is not None: pbr[slot]={'index':t}
            for slot,input_name in [('normalTexture','normal'),('emissiveTexture','emissiveColor')]:
                t=texture(shader,input_name)
                if t is not None: result[slot]={'index':t}
            if 'emissiveTexture' in result: result['emissiveFactor']=[1,1,1]
            if opacity<1: result['alphaMode']='BLEND'
        idx=len(doc['materials']); doc['materials'].append(result); material_cache[key]=idx; return idx
    processed=[]
    for mesh in meshes:
        prim=mesh.GetPrim(); points=np.array(mesh.GetPointsAttr().Get(),dtype=float)
        matrix=np.array(cache.GetLocalToWorldTransform(prim))
        transformed=(np.column_stack((points,np.ones(len(points))))@matrix)[:,:3]*meters
        if zup: transformed=transformed[:,[0,2,1]]*np.array([1,1,-1])
        counts=list(mesh.GetFaceVertexCountsAttr().Get()); indices=np.array(mesh.GetFaceVertexIndicesAttr().Get())
        holes=set(mesh.GetHoleIndicesAttr().Get() or [])
        corners=[]; faces=[]; offset=0
        for f,count in enumerate(counts):
            if f not in holes:
                for j in range(1,count-1):
                    tri=[offset,offset+j,offset+j+1]
                    if mesh.GetOrientationAttr().Get()=='leftHanded': tri.reverse()
                    corners.extend(tri); faces.extend([f]*3)
            offset+=count
        corners=np.array(corners); vertices=indices[corners]
        pos=transformed[vertices]
        def expand(values, interpolation):
            values=np.array(values)
            if interpolation=='faceVarying': return values[corners]
            if interpolation in ('vertex','varying'): return values[vertices]
            if interpolation=='uniform': return values[faces]
            if interpolation=='constant': return np.repeat(values[:1],len(corners),axis=0)
            raise ValueError(f'Unsupported interpolation {interpolation}')
        normals=mesh.GetNormalsAttr().Get()
        if normals:
            normal=expand(normals,mesh.GetNormalsInterpolation())@np.linalg.inv(matrix[:3,:3]).T
            if zup: normal=normal[:,[0,2,1]]*np.array([1,1,-1])
        else:
            tri=pos.reshape(-1,3,3); n=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]); normal=np.repeat(n,3,axis=0)
        normal/=np.maximum(np.linalg.norm(normal,axis=1,keepdims=True),1e-12)
        uv=UsdGeom.PrimvarsAPI(prim).GetPrimvar('st')
        texcoords=expand(uv.ComputeFlattened(),uv.GetInterpolation()) if uv and uv.HasValue() else None
        if texcoords is not None: texcoords[:,1]=1-texcoords[:,1]
        processed.append((prim.GetName(),pos,normal,texcoords,material(prim)))
    allpoints=np.concatenate([p[1] for p in processed]); low=allpoints.min(axis=0); high=allpoints.max(axis=0)
    origin=np.array([(low[0]+high[0])/2,low[1],(low[2]+high[2])/2])
    triangle_count=0
    for meshname,pos,normal,uv,mat in processed:
        attrs={'POSITION':accessor(pos-origin,'VEC3'),'NORMAL':accessor(normal,'VEC3')}
        if uv is not None: attrs['TEXCOORD_0']=accessor(uv,'VEC2')
        i=len(doc['meshes']); doc['meshes'].append({'name':meshname,'primitives':[{'attributes':attrs,'material':mat}]})
        doc['nodes'].append({'mesh':i,'name':meshname}); doc['scenes'][0]['nodes'].append(i)
        triangle_count+=len(pos)//3
    doc['buffers']=[{'byteLength':len(binary)}]
    while len(binary)%4: binary.append(0)
    j=json.dumps(doc,separators=(',',':')).encode(); j+=b' '*((-len(j))%4)
    output=struct.pack('<4sII',b'glTF',2,12+8+len(j)+8+len(binary))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(binary),b'BIN\x00')+binary
    path=OUT/f'{name}.glb'; path.write_bytes(output)
    report={'id':name,'file':path.name,'triangles':triangle_count,'meshes':len(processed),'dimensionsMeters':(high-low).tolist(),'bytes':len(output),'sha256':hashlib.sha256(output).hexdigest()}
    print(json.dumps(report),flush=True); return report

if __name__=='__main__':
    reports=[convert(n) for n in ASSETS]
    (OUT/'manifest.json').write_text(json.dumps({'creator':'NVIDIA','license':'CC-BY-4.0','source':'https://huggingface.co/datasets/nvidia/simready-assets','revision':REVISION,'assets':reports},indent=2)+'\n')
    (OUT/'LICENSE.txt').write_bytes((DEST/ASSETS[0]/'.metadata/LICENSE.txt').read_bytes())
