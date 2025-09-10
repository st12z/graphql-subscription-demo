import express from "express";
import { createServer } from "http";
import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws"; 

import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = createServer(app);

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
