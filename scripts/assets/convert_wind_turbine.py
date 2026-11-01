"""Convert Innerscene's CC0 Rhino meshes; preserve the authored blade geometry."""
import json, struct, hashlib
from pathlib import Path
import rhino3dm as r
source=Path('simulation/assets/innerscene/wind-turbine.3dm')
f=r.File3dm.Read(str(source))
blob=bytearray(); views=[]; accessors=[]; meshes=[]; nodes=[]; materials=[]
def accessor(data,fmt,kind,component):
    while len(blob)%4:blob.append(0)
    start=len(blob)
    flat=[v for row in data for v in row] if isinstance(data[0],list) else data
    blob.extend(struct.pack('<'+fmt*len(flat),*flat))
    views.append({'buffer':0,'byteOffset':start,'byteLength':len(blob)-start})
    a={'bufferView':len(views)-1,'componentType':component,'count':len(data),'type':kind}
    if kind=='VEC3':a.update(min=[min(v[i] for v in data) for i in range(3)],max=[max(v[i] for v in data) for i in range(3)])
    accessors.append(a); return len(accessors)-1
# Rotor axis is source X; pivot derived from the authored hub center.
pivot=[-4.4,61.9,0]
rotor=[]; fixed=[]
for o in f.Objects:
    m=o.Geometry; name=o.Attributes.Name
    spinning=name.startswith('Blade') or name=='Hub and spinner'
    origin=pivot if spinning else [0,0,0]
    vertices=[[v.X/1000-origin[0],v.Z/1000-origin[1],-v.Y/1000-origin[2]] for v in m.Vertices]
    normals=[[n.X,n.Z,-n.Y] for n in m.Normals]
    indices=[]
    for a,b,c,d in m.Faces:
        indices.extend([a,b,c])
        if c!=d:indices.extend([a,c,d])
    color=f.Layers[o.Attributes.LayerIndex].Color
    # Rhino layer colors are sRGB; glTF base-color factors are linear.
    linear=lambda v:(v/255/12.92 if v/255<=.04045 else ((v/255+.055)/1.055)**2.4)
    materials.append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':[linear(c) for c in color[:3]]+[1],'metallicFactor':.15,'roughnessFactor':.48}})
    attrs={'POSITION':accessor(vertices,'f','VEC3',5126)}
    if len(normals)==len(vertices):attrs['NORMAL']=accessor(normals,'f','VEC3',5126)
    meshes.append({'name':name,'primitives':[{'attributes':attrs,'indices':accessor(indices,'I','SCALAR',5125),'material':len(materials)-1}]})
    nodes.append({'name':name,'mesh':len(meshes)-1})
    (rotor if spinning else fixed).append(len(nodes)-1)
nodes.append({'name':'Rotor','translation':pivot,'children':rotor});fixed.append(len(nodes)-1)
doc={'asset':{'version':'2.0','copyright':'Innerscene — CC0 1.0','extras':{'source':'https://www.innerscene.com/tools/library/3d-parts/wind-turbine-d67dce35','sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'changes':'Rhino mesh conversion; millimeters Z-up to meters Y-up; rotor pivot added; original meshes preserved.'}},'scene':0,'scenes':[{'nodes':fixed}],'nodes':nodes,'meshes':meshes,'materials':materials,'buffers':[{'byteLength':len(blob)}],'bufferViews':views,'accessors':accessors}
raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);blob+=b'\0'*((-len(blob))%4)
output=struct.pack('<III',0x46546c67,2,28+len(raw)+len(blob))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(blob),0x004e4942)+blob
Path('public/models/innerscene/wind-turbine.glb').write_bytes(output)
print('Wind turbine converted:',len(output),'bytes')
