import zlib from "zlib";
import fs from "fs";
import { performance } from "perf_hooks";

export function benchmarkCompression(payload, outputFile = "compression_benchmark.json") {
  const json = JSON.stringify(payload);

  // Không nén
  const noCompressionSize = Buffer.byteLength(json);
  const startNo = performance.now();
  JSON.parse(json);
  const endNo = performance.now();

  // Có nén
  const startComp = performance.now();
  const compressed = zlib.gzipSync(json);
  const endComp = performance.now();

  const startDecomp = performance.now();
  const decompressed = zlib.gunzipSync(compressed).toString();
  JSON.parse(decompressed);
  const endDecomp = performance.now();

  // Kết quả
  const results = {
    no_compression: {
      size_bytes: noCompressionSize,
      process_time_ms: endNo - startNo,
    },
    with_compression: {
      compressed_size_bytes: Buffer.byteLength(compressed),
      compression_time_ms: endComp - startComp,
      decompression_time_ms: endDecomp - startDecomp,
      total_process_time_ms: (endComp - startComp) + (endDecomp - startDecomp),
    },
  };

  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

  return results;
}
