import { gql } from "apollo-server-express";

export const typeDefsChat = gql`
  scalar Date
  type Chat {
    id: ID!
    roomChatID: String!
    userSendID: String!
    message: String!
    createdAt: Date!
    isRead: Boolean
  }

  type RoomChat {
    id: ID!
    userAID: String!
    userBID: String!
    createdAt: Date!
  }

  type Query {
    getMessages(roomChatID: ID!): [Chat]!
  }

  type Mutation {
    sendMessage(roomChatID: ID!, message: String!): Chat!
  }

  type Subscription {
    newMessage(roomChatID: ID!): Chat!
  }
`;
