// utils/compression.js
import zlib from "zlib";

export function compressPayload(payload) {
  const json = JSON.stringify(payload);
  const before = Buffer.byteLength(json);

  console.time("Compress time");
  const compressed = zlib.gzipSync(json);
  console.timeEnd("Compress time");

  const after = Buffer.byteLength(compressed);
  console.log(`[Compress] Before=${before}B After=${after}B Saved=${before - after}B`);
  return compressed.toString("base64");
}

export function decompressPayload(base64) {
  const buffer = Buffer.from(base64, "base64");

  console.time("Decompress time");
  const json = zlib.gunzipSync(buffer).toString();
  console.timeEnd("Decompress time");

  return JSON.parse(json);
}