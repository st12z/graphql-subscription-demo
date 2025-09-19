import { gql } from "apollo-server-express";

export const typeDefsUser = gql`
  scalar Date
  type User {
    id: ID!
    username: String!
    avatar: String
    requestFriends: [ID]
    acceptFriends: [ID]
    status: String!
    isFriends: [ID]
    timeOnl: Date
    token: String
  }
  type Query {
    getListUsers: [User]
  }

  type Mutation {
    createUser(username: String!,password: String): User!
    addFriend(userAcceptId: ID!): [User!]
    loginUser(username: String!, password: String!): User!
    acceptFriend(userSendId: ID!, userAcceptId: ID!): [User]
    logoutUser: User!
  }
  type FriendPayload {
    userSendId: ID!
    userAcceptId: ID!
  }
  type Subscription {
    getListUsers: [User]
    friendRequested(userAcceptId: ID!): FriendPayload
    loginUser: UserLoginInfo
    friendAccepted(userSendId: ID!): FriendPayload
    logoutUser(userId: ID!): ID
  }

  type UserLoginInfo {
    id: ID!
    status: String!
    timeOnl: Date
  }
`;
