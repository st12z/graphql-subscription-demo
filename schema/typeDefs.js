import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Model {
    id: ID!
    name: String!
  }

  type Query {
    getModels: [Model!]!
  }

  type Mutation {
    createModel(name: String!): Model!
  }

  type Subscription {
    getListModel: [Model]
  }
`;
