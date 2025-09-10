import { pubsub, EVENTS } from "../pubsub.js";

export const models = [];

export const resolvers = {
  Query: {
    getModels: () => models,
  },
  Mutation: {
    createModel: (_, { name }) => {
      const model = { id: models.length + 1, name };
      models.push(model);
      pubsub.publish(EVENTS.MODEL_CREATED, { getListModel: models });
      return model;
    },
  },
  Subscription: {
    getListModel: {
      subscribe: () => pubsub.asyncIterableIterator(EVENTS.MODEL_CREATED),
    },
  },
};
