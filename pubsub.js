import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();

export const EVENTS = {
  MODEL_CREATED: "MODEL_CREATED",
  FRIEND_ADDED: "FRIEND_ADDED",
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  FRIEND_ADDED: "FRIEND_ADDED",
};
