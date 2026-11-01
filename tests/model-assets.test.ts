import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { MODEL_CATALOG } from "../lib/model-catalog";
const { validateBytes } = createRequire(import.meta.url)("gltf-validator");

test("every catalog model is a valid self-contained glTF asset with a credited source", async () => {
  for (const model of MODEL_CATALOG) {
    const bytes = new Uint8Array(await readFile(`public${model.path}`));
    const report = await validateBytes(bytes);
    assert.equal(report.issues.numErrors, 0, `${model.name}: ${JSON.stringify(report.issues.messages.filter((m: {severity:number})=>m.severity===0))}`);
    const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    const json = JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+view.getUint32(12,true))));
    assert.ok(json.meshes.length > 0, model.name);
    assert.ok(json.buffers.every((b: {uri?:string})=>!b.uri), `${model.name} must not depend on a remote buffer`);
    assert.ok((json.images??[]).every((i: {uri?:string})=>!i.uri), `${model.name} must embed textures`);
    if ("select" in model) {
      const prefix=model.select.replace(/\*$/, "");
      assert.ok(json.nodes.some((n:{name?:string}) => model.select.endsWith("*") ? n.name?.startsWith(prefix) : n.name===prefix), `${model.name} selection exists`);
    }
    assert.ok(model.source.startsWith("https://"));
  }
});
