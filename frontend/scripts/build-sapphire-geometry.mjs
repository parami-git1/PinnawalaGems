import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// The website supplies its own sapphire and gold materials. Retain every source
// vertex, normal, tangent, UV, index and node, without its unused texture images.
const originalPath = new URL('../public/gem.glb', import.meta.url);
const outputPath = new URL('../public/models/perf-sapphire-geometry-v1.glb', import.meta.url);
const original = await readFile(originalPath);
assert.equal(original.readUInt32LE(0), 0x46546c67);
assert.equal(original.readUInt32LE(4), 2);
const jsonLength = original.readUInt32LE(12);
const source = JSON.parse(original.subarray(20, 20 + jsonLength).toString('utf8'));
const binaryOffset = 20 + jsonLength + 8;
assert.equal(original.readUInt32LE(binaryOffset - 4), 0x004e4942);
assert.equal(source.buffers.length, 1);
assert(!source.animations?.length && !source.skins?.length);

const geometry = structuredClone(source);
const views = [...new Set(geometry.accessors.map(accessor => accessor.bufferView))].sort((a, b) => a - b);
const remap = new Map();
const chunks = [];
let offset = 0;
geometry.bufferViews = views.map((index, replacement) => {
  const view = source.bufferViews[index];
  assert.equal(view.buffer, 0);
  const padding = (4 - offset % 4) % 4;
  if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
  const bytes = original.subarray(binaryOffset + (view.byteOffset || 0), binaryOffset + (view.byteOffset || 0) + view.byteLength);
  assert.equal(bytes.length, view.byteLength);
  const result = { ...view, byteOffset: offset };
  chunks.push(bytes);
  offset += bytes.length;
  remap.set(index, replacement);
  return result;
});
geometry.accessors.forEach(accessor => { accessor.bufferView = remap.get(accessor.bufferView); });
geometry.meshes.forEach(mesh => mesh.primitives.forEach(primitive => { delete primitive.material; }));
for (const key of ['materials', 'textures', 'images', 'samplers', 'extensionsUsed', 'extensionsRequired']) delete geometry[key];
geometry.buffers = [{ byteLength: offset }];
const binary = Buffer.concat(chunks);
const binaryPadding = (4 - binary.length % 4) % 4;
const encoded = Buffer.from(JSON.stringify(geometry));
const json = Buffer.concat([encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 0x20)]);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(20 + json.length + 8 + binary.length + binaryPadding, 8);
header.writeUInt32LE(json.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binaryHeader = Buffer.alloc(8);
binaryHeader.writeUInt32LE(binary.length + binaryPadding, 0);
binaryHeader.writeUInt32LE(0x004e4942, 4);
const output = Buffer.concat([header, json, binaryHeader, binary, Buffer.alloc(binaryPadding)]);

// Compare all original geometry buffers byte for byte before publishing a file.
assert.deepEqual(geometry.nodes, source.nodes);
geometry.accessors.forEach((accessor, index) => {
  const oldAccessor = source.accessors[index];
  assert.deepEqual({ ...accessor, bufferView: oldAccessor.bufferView }, oldAccessor);
  const before = source.bufferViews[oldAccessor.bufferView];
  const after = geometry.bufferViews[accessor.bufferView];
  assert.deepEqual(binary.subarray(after.byteOffset, after.byteOffset + after.byteLength),
    original.subarray(binaryOffset + (before.byteOffset || 0), binaryOffset + (before.byteOffset || 0) + before.byteLength));
});
await mkdir(new URL('../public/models/', import.meta.url), { recursive: true });
await writeFile(outputPath, output);
console.log(JSON.stringify({ output: fileURLToPath(outputPath), originalBytes: original.length, bytes: output.length,
  savedPercent: Number((100 * (1 - output.length / original.length)).toFixed(2)), exactGeometryPreserved: true }));
