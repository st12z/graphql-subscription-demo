import fs from "fs";

// 📂 Đọc dữ liệu benchmark
const data = JSON.parse(fs.readFileSync("batch_compression.json", "utf8"));

// 🧮 Hàm tính thống kê
function calcStats(list) {
  if (list.length === 0) return { totalEvents: 0, totalTime: 0, avgTime: 0, publishes: 0 };
  const totalEvents = list.reduce((sum, x) => sum + x.count, 0);
  const totalTime = list.reduce((sum, x) => sum + x.durationMs, 0);
  const avgTime = totalTime / list.length;
  const publishes = list.length;
  return { totalEvents, totalTime, avgTime, publishes };
}

// 📊 Tính toán số liệu cho 2 chế độ
const batchStats = calcStats(data.batch);
const noBatchStats = calcStats(data.no_batch);

// 📋 In bảng so sánh
console.log("\n=== 📊 BẢNG SO SÁNH BATCH vs NO BATCH ===\n");

console.table([
  {
    "Chế độ": "Batch",
    "Tổng số lần publish": batchStats.publishes,
    "Tổng số event gửi": batchStats.totalEvents,
    "Tổng thời gian (ms)": batchStats.totalTime.toFixed(2),
    "Thời gian TB / publish (ms)": batchStats.avgTime.toFixed(2),
  },
  {
    "Chế độ": "No Batch",
    "Tổng số lần publish": noBatchStats.publishes,
    "Tổng số event gửi": noBatchStats.totalEvents,
    "Tổng thời gian (ms)": noBatchStats.totalTime.toFixed(2),
    "Thời gian TB / publish (ms)": noBatchStats.avgTime.toFixed(2),
  },
]);
