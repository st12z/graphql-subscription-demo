import { createClient } from "graphql-ws";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Tổng số kết nối test
const TOTAL_CONNECTIONS = 10;

// URL load balancer Nginx
const WS_URL = "ws://localhost:8080/graphql";

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// Lưu các client để giữ kết nối sống
const clients = [];

async function openConnections() {
  console.log(`🚀 Mở ${TOTAL_CONNECTIONS} kết nối WebSocket qua Load Balancer...`);
  
  for (let i = 0; i < TOTAL_CONNECTIONS; i++) {
    const token = createToken(`user_${i}`);
    console.log(`[${i}] Token gửi lên LB:`, token);

    const client = createClient({
      url: WS_URL,
      connectionParams: { Authorization: `Bearer ${token}` },
      lazy: false,       // kết nối ngay
      retryAttempts: 5,  // thử lại nếu fail
    });

    client.subscribe(
      { query: `subscription { getListUsers { id username } }` },
      {
        next: (data) => console.log(`[${i}] Received`, data),
        error: (err) => console.error(`[${i}] Error`, err),
        complete: () => console.log(`[${i}] Complete`),
      }
    );

    clients.push(client);

    // Delay nhỏ để tránh quá tải Nginx/Node
    await new Promise((res) => setTimeout(res, 100));
  }
}

// Mở kết nối
openConnections();

// Log số clients hiện tại mỗi 5s
setInterval(() => {
  console.log(`📊 Clients hiện tại: ${clients.length}`);
}, 5000);
