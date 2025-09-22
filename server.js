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

// WebSocketServer cho graphql-ws
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

// gắn graphql-ws
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

      return { userId };
    },
  },
  wsServer
);
const PORT =process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}/graphql`);
});
