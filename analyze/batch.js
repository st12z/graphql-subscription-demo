import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// 📂 Hàm đọc và parse file JSON
function loadData(file) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Lỗi đọc file ${file}:`, err.message);
    return null;
  }
}

// 🧮 Hàm tính thống kê cho batch
function calcStats(list) {
  if (!list || list.length === 0) return { totalEvents: 0, totalTime: 0, avgTime: 0, publishes: 0 };
  const totalEvents = list.reduce((sum, x) => sum + x.count, 0);
  const totalTime = list.reduce((sum, x) => sum + x.durationMs, 0);
  const avgTime = totalTime / list.length;
  const publishes = list.length;
  return { totalEvents, totalTime, avgTime, publishes };
}

// 📊 Hàm phân tích 1 file
function analyzeFile(filePath, label) {
  const data = loadData(filePath);
  if (!data || !data.batch) return null;

  const batchStats = calcStats(data.batch);

  return {
    label,
    batchStats,
  };
}

// 🧠 Phân tích 2 file (4000 & 4001)
const result4000 = analyzeFile("batch_compression_4000.json", "Cổng 4000");
const result4001 = analyzeFile("batch_compression_4001.json", "Cổng 4001");

// 📋 In bảng so sánh
console.log("\n=== 📊 BẢNG THỐNG KÊ CHẾ ĐỘ BATCH THEO CỔNG ===\n");

const tableData = [];

for (const result of [result4000, result4001]) {
  if (!result) continue;
  tableData.push({
    "Cổng": result.label,
    "Tổng số lần publish": result.batchStats.publishes,
    "Tổng số event gửi": result.batchStats.totalEvents,
    "Tổng thời gian (ms)": result.batchStats.totalTime.toFixed(2),
    "Thời gian TB / publish (ms)": result.batchStats.avgTime.toFixed(2),
  });
}

console.table(tableData);
