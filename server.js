import express from "express";
import { createServer } from "http";
import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws"; 
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import { typeDefsUser } from "./typeDefs/user.typeDefs.js";
import { resolverUser } from "./resolvers/resolverUser.js";
// connect db
connectDB();

const schema = makeExecutableSchema({ 
  typeDefs:[typeDefsUser],
  resolvers: [resolverUser]
});
const app = express();
const httpServer = createServer(app);

// Apollo Server
const apolloServer = new ApolloServer({ schema });
await apolloServer.start();
apolloServer.applyMiddleware({ app });

// WebSocket cho subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

useServer({ schema }, wsServer);

httpServer.listen(4000, () => {
  console.log("Server chạy tại http://localhost:4000/graphql");
});
