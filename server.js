import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import { ApolloServer } from "apollo-server-express";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import resolvers from "./resolvers/index.js";
import typeDefs from "./schemas/index.js";
import Redis from "ioredis";
import { RedisPubSub } from "graphql-redis-subscriptions";

dotenv.config();
const { MONGO_CONNECTION_URI, REDIS_URL, REDIS_PORT, REDIS_PASSWORD } =
  process.env;

const redisOptions = {
  host: REDIS_URL,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
};
export const pubsub = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions),
});

(async function () {
  const app = express();
  const httpServer = createServer(app);
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });
  const server = new ApolloServer({
    schema,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
  });
  const subscriptionServer = SubscriptionServer.create(
    { schema, execute, subscribe },
    { server: httpServer, path: server.graphqlPath }
  );

  await mongoose
    .connect(MONGO_CONNECTION_URI)
    .then(() => console.log("db connected"))
    .catch(console.log);

  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT);
})();
