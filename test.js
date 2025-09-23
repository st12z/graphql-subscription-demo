import mongoose from "mongoose";
import { createClient } from "graphql-ws";
import WebSocket from "ws";
import fetch from "cross-fetch";
import User from "./models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
console.log("MONGO_URI =", process.env.MONGO_URI);

const WS_URL = "ws://localhost:4000/graphql";
const HTTP_URL = "http://localhost:4000/graphql";
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

const TOTAL_CLIENTS = 1000;
let receivedCount = 0;
let firstEventTime = null;
let startPublish = null;

// ✅ tạo JWT token hợp lệ từ userId
function makeAuthToken(userId) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
  return `Bearer ${token}`;
}

function createSubscriber(id) {
  return new Promise((resolve) => {
    const client = createClient({
      url: WS_URL,
      webSocketImpl: WebSocket,
      connectionParams: { authorization: makeAuthToken(id) },
    });

    client.subscribe(
      {
        query: `
          subscription {
            loginUser {
              id
              status
              timeOnl
            }
          }
        `,
      },
      {
        next: (data) => {
          const now = Date.now();
          if (!firstEventTime) {
            firstEventTime = now;
            console.log(`📩 First client nhận sau ${now - startPublish} ms`);
          }
          receivedCount++;
          if (receivedCount === TOTAL_CLIENTS) {
            console.log(
              `📊 Tất cả ${TOTAL_CLIENTS} client nhận xong sau ${
                now - startPublish
              } ms`
            );
            process.exit(0);
          }
        },
        error: (err) => console.error("❌ Lỗi subscription:", err),
      }
    );
    resolve(client);
  });
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Kết nối MongoDB");

  const users = await User.find({}).limit(TOTAL_CLIENTS);
  if (users.length < TOTAL_CLIENTS) {
    console.error("⚠️ Không đủ 1000 user trong DB");
    process.exit(1);
  }

  console.log(`🚀 Tạo ${TOTAL_CLIENTS} subscribers...`);
  await Promise.all(users.map((u) => createSubscriber(u.id)));
  console.log("✅ 1000 clients đã subscribe xong");

  setTimeout(async () => {
    console.log("🔑 Gửi mutation loginUser cho user thuc1...");
    startPublish = Date.now();
    const res = await fetch(HTTP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation {
            loginUser(username: "thuc1", password: "123") {
              id
              username
              status
              timeOnl
              token
            }
          }
        `,
      }),
    });
    const json = await res.json();
    console.log("Mutation result:", json.data);
  }, 2000);
}

main();
