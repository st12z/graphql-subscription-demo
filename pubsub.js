import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();
export const EVENTS = {
  MODEL_CREATED: "MODEL_CREATED",
  FRIEND_REQUESTED: "FRIEND_REQUESTED",
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  FRIEND_ACCEPTED: "FRIEND_ACCEPTED",
  MESSAGE_SENT: "MESSAGE_SENT",
};
