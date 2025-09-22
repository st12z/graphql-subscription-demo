import { RedisPubSub } from "graphql-redis-subscriptions";
import { PubSub } from "graphql-subscriptions";
import Redis from "ioredis";

const options = {
  host: "127.0.0.1",
  port: 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
};
export const pubsub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});
export const EVENTS = {
  MODEL_CREATED: "MODEL_CREATED",
  FRIEND_ADDED: "FRIEND_ADDED",
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  FRIEND_ADDED: "FRIEND_ADDED",
  MESSAGE_SENT: "MESSAGE_SENT",
  FRIEND_ONLINE: "FRIEND_ONLINE",
};
