import { gql } from "apollo-server-express";

export const typeDefsUser = gql`
  scalar Date
  type User {
    id: ID!
    username: String!
    avatar: String
    requestFriends: [ID]
    acceptFriends: [ID]
    isFriends: [ID]
    timeOnl: Date
  }

  type LoginUserResponse {
    id: ID!
    username: String!
    avatar: String
    token: String!
  }

  type Query {
    getListUsers: [User]
  }

  type Mutation {
    createUser(username: String!,password: String): User!
    addFriend(userAcceptId: ID!): [User!]
    loginUser(username: String!, password: String!): LoginUserResponse!
    acceptFriend(userSendId: ID!, userAcceptId: ID!): [User]
  }
  type FriendPayload {
    userSendId: ID!
    userAcceptId: ID!
  }
  type Subscription {
    getListUsers: [User]
    friendRequested(userAcceptId: ID!): FriendPayload
    loginUser(userId: ID!): UserLoginInfo
    friendAccepted(userSendId: ID!): FriendPayload
  }

  type UserLoginInfo {
    id: ID!
    username: String!
    avatar: String
    online: Boolean!
  }
`;
