// analyze/compress.js
import fs from "fs";
import path from "path";
import Table from "cli-table3";

const COMPRESS_FILE = path.resolve("compression_benchmark.json");

/**
 * Đọc dữ liệu từ file nén
 */
function readCompressionData() {
  if (!fs.existsSync(COMPRESS_FILE)) {
    console.error("❌ Không tìm thấy file compression_benchmark.json");
    process.exit(1);
  }

  const raw = fs.readFileSync(COMPRESS_FILE, "utf8");
  const data = JSON.parse(raw);

  return data;
}

/**
 * Hiển thị bảng so sánh nén vs không nén
 */
function showCompressionTable(data) {
  const table = new Table({
    head: [
      "Chế độ",
      "Kích thước (B)",
      "Thời gian nén (ms)",
      "Thời gian giải nén (ms)",
      "Tổng thời gian (ms)",
      "Tiết kiệm (%)",
    ],
    colAligns: ["center", "right", "right", "right", "right", "right"],
    style: { head: ["green"], border: [] },
  });

  const originalSize = data.no_compression.size_bytes;
  const compressedSize = data.with_compression.compressed_size_bytes;
  const savedPercent = (
    ((originalSize - compressedSize) / originalSize) *
    100
  ).toFixed(2);

  table.push(
    [
      "Không nén",
      originalSize,
      "—",
      "—",
      data.no_compression.process_time_ms.toFixed(3),
      "0%",
    ],
    [
      "Có nén",
      compressedSize,
      data.with_compression.compression_time_ms.toFixed(3),
      data.with_compression.decompression_time_ms.toFixed(3),
      data.with_compression.total_process_time_ms.toFixed(3),
      `${savedPercent}%`,
    ]
  );

  console.log("\n📊 So sánh Nén vs Không Nén");
  console.log(table.toString());
}

/**
 * Phân tích & đánh giá kết quả
 */
function analyze(data) {
  const sizeBefore = data.no_compression.size_bytes;
  const sizeAfter = data.with_compression.compressed_size_bytes;
  const timeBefore = data.no_compression.process_time_ms;
  const timeAfter = data.with_compression.total_process_time_ms;

  console.log("\n🧠 Phân tích nhanh:");
  console.log(`- Kích thước gốc: ${sizeBefore}B → sau nén: ${sizeAfter}B`);
  console.log(
    `- Giảm dung lượng: ${(100 * (sizeBefore - sizeAfter) / sizeBefore).toFixed(
      2
    )}%`
  );
  console.log(
    `- Thời gian xử lý không nén: ${timeBefore.toFixed(
      3
    )} ms, có nén (nén + giải nén): ${timeAfter.toFixed(3)} ms`
  );

  if (timeAfter > timeBefore) {
    console.log(
      `⚠️ Nén giúp giảm dung lượng nhưng **tốn thêm thời gian xử lý**, phù hợp khi gửi qua mạng.`
    );
  } else {
    console.log(`✅ Nén vừa nhanh vừa tiết kiệm dung lượng (trường hợp hiếm).`);
  }
}

function main() {
  const data = readCompressionData();
  showCompressionTable(data);
  analyze(data);
}

main();
