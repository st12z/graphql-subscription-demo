// scripts/benchmark_create_users.js
import fetch from "node-fetch";
import dotenv from "dotenv"
dotenv.config();
const GRAPHQL_ENDPOINT =`http://${process.env.IP}:8081/graphql`;

// 📝 Số lượng user cần tạo
const TOTAL_USERS = 100;

// ⚙️ Bật/tắt batch bằng cách set USE_BATCH ở backend (vd: qua biến môi trường)

async function createUser(username, password) {
  const mutation = `
    mutation CreateUser($username: String!, $password: String!) {
      createUser(username: $username, password: $password) {
        id
        username
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: mutation,
      variables: { username, password },
    }),
  });

  const data = await response.json();
  if (data.errors) {
    console.error("❌ Error:", data.errors);
  }
  return data.data;
}

async function runBenchmark() {
  console.log(`🚀 Bắt đầu tạo ${TOTAL_USERS} users ...\n`);
  const start = performance.now();
  const tasks = [];
  for (let i = 0; i < TOTAL_USERS; i++) {
    const username = `user_${i}`;
    tasks.push(createUser(username, "123"));
  }

  await Promise.all(tasks);

  const end = performance.now();
  const duration = ((end - start) / 1000).toFixed(2);
  console.log(`✅ Hoàn tất tạo ${TOTAL_USERS} users trong ${duration} giây`);
  console.log("👉 Xem file batch_compression.json để xem thống kê benchmark\n");
}

runBenchmark().catch((err) => {
  console.error("❌ Benchmark failed:", err);
});
