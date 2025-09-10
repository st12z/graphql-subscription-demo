import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();

export const EVENTS = {
  MODEL_CREATED: "MODEL_CREATED",
};
