import fs from "fs";
import path from "path";
import dotenv from "dotenv";
let batchQueue = [];
let batchTimeout = null;
dotenv.config();
const BENCHMARK_FILE = path.resolve(`batch_compression_${process.env.PORT}.json`);

// ✅ Hàm đọc dữ liệu hiện tại
function readBenchmark() {
  try {
    if (fs.existsSync(BENCHMARK_FILE)) {
      const data = JSON.parse(fs.readFileSync(BENCHMARK_FILE, "utf8"));
      // Đảm bảo có đủ 2 key
      return {
        batch: data.batch || [],
        no_batch: data.no_batch || [],
      };
    }
  } catch (err) {
    console.error("Không đọc được file benchmark:", err);
  }
  return { batch: [], no_batch: [] };
}

// ✅ Hàm ghi dữ liệu theo 2 loại
function saveBenchmark(result, type = "batch") {
  const data = readBenchmark();

  if (type === "batch") {
    data.batch.push(result);
  } else {
    data.no_batch.push(result);
  }

  fs.writeFileSync(BENCHMARK_FILE, JSON.stringify(data, null, 2), "utf8");
  console.log(`📊 Benchmark saved to batch_compression_${process.env.PORT}.json`);
}

/**
 * Batching publish theo thời gian (mặc định 200ms)
 */
export function batchPublish(pubsub, event, payload, delay = 200) {
  const start = performance.now();

  batchQueue.push(payload);
  if (!batchTimeout) {
    batchTimeout = setTimeout(() => {
      const batched = [...batchQueue];
      batchQueue = [];
      batchTimeout = null;

      const end = performance.now();
      const duration = (end - start).toFixed(2);

      console.log(`[Batch] Published ${batched.length} events in ${duration} ms`);

      pubsub.publish(event, { batched });

      saveBenchmark(
        {
      
          event,
          count: batched.length,
          durationMs: Number(duration),
          timestamp: new Date().toISOString(),
        },
        "batch"
      );
    }, delay);
  }
}

/**
 * Publish không batch (dùng để benchmark so sánh)
 */
export function directPublish(pubsub, event, payload) {
  const start = performance.now();

  pubsub.publish(event, { getListUsers: payload });

  const end = performance.now();
  const duration = (end - start).toFixed(2);

  console.log(`[NoBatch] Published 1 event in ${duration} ms`);

  saveBenchmark(
    {
      event,
      count: 1,
      durationMs: Number(duration),
      timestamp: new Date().toISOString(),
    },
    "no_batch"
  );
}
