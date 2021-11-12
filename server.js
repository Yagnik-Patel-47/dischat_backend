import { createServer } from "http";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import resolvers from "./resolvers/index.js";
import typeDefs from "./schemas/index.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();
// (async () => {
//   const server = new ApolloServer({
//     typeDefs,
//     resolvers,
//   });
//   await mongoose
//     .connect(process.env.MONGO_CONNECTION_URI)
//     .then(() => console.log("db connected"))
//     .catch(console.log);

//   const { url } = await server.listen();
//   console.log(`🚀 Server ready at ${url}`);
// })();
const pubsub = new PubSub();

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
    .connect(process.env.MONGO_CONNECTION_URI)
    .then(() => console.log("db connected"))
    .catch(console.log);

  await server.start();
  server.applyMiddleware({ app });

  const PORT = 4000 || process.env.PORT;
  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}/graphql`)
  );
})();

export { pubsub };
