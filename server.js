import express from "express";
import { createServer } from "http";
import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";// lưu ý path
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import { connectDB } from "./config/database.js";
import { typeDefsUser } from "./typeDefs/user.typeDefs.js";

import { resolverUser } from "./resolvers/resolverUser.js";

dotenv.config();
connectDB();

// Hàm decode token
function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (err) {
    return null;
  }
}

const schema = makeExecutableSchema({
  typeDefs: [typeDefsUser],
  resolvers: [resolverUser],
});

const app = express();
const httpServer = createServer(app);

// ApolloServer cho query/mutation
const apolloServer = new ApolloServer({
  schema,
  context: ({ req }) => {
    // context cho HTTP
    const token = req?.headers?.authorization?.replace("Bearer ", "");
    const userId = getUserIdFromToken(token);
    return { userId };
  },
});

await apolloServer.start();
apolloServer.applyMiddleware({ app });
const socketUserMap = new WeakMap();

// WebSocketServer cho graphql-ws
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
// Thêm cờ isAlive cho mỗi kết nối
wsServer.on("connection", (socket) => {
  socket.isAlive = true;

  // khi nhận pong từ client thì đánh dấu alive
  socket.on("pong", () => {
    const userId = socketUserMap.get(socket);
    console.log(`🫀 Nhận pong từ client của userId=${userId}, đánh dấu kết nối còn sống`);
    socket.isAlive = true;
    
  });
  console.log(`📊 Tổng connection sau khi connect: ${wsServer.clients.size}`);
});
// Tạo interval để ping/pong
const interval = setInterval(() => {
  console.log(`📊 Số kết nối hiện tại: ${wsServer.clients.size}`);
  wsServer.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      const userId = socketUserMap.get(ws);
      console.log(`💀 Không nhận được pong từ client của userId=${userId}, đóng kết nối`);
      socketUserMap.delete(ws);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping(); // gửi ping -> chờ pong
    const userId = socketUserMap.get(ws);   if(userId!="")
    console.log(`🫀 Gửi ping đến client của userId=${userId}`);
  });

}, 30000); // 30s check một lần

wsServer.on("close", () => {
  clearInterval(interval);
  socketUserMap.clear();
  console.log("📊 Tổng connection sau khi close: ", wsServer.clients.size);
});

useServer(
  {
    schema,
    context: (ctx) => {
      // ctx.connectionParams chứa headers từ client
      const authHeader =
        ctx.connectionParams?.Authorization ||
        ctx.connectionParams?.authorization ||
        "";
      const token = authHeader.replace("Bearer ", "");
      const userId = getUserIdFromToken(token);
      if (!userId) throw new Error("Unauthorized");
      socketUserMap.set(ctx.extra.socket, userId);
      return { userId };
    },
    onConnect: (ctx) => {
      console.log("🔗 Client connected");
    },
    onClose: (ctx, code, reason) => {
      console.log("❌ Client disconnected", code, reason.toString());
    },
  },
  wsServer
);
const PORT =process.env.PORT || 4000;
httpServer.keepAliveTimeout = 120000; // 2 phút
httpServer.headersTimeout = 125000;
httpServer.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}/graphql`);
});
