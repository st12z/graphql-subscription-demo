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
    addFriend(userAcceptId: ID!): [User!] #Trả về list chứa thông tin người gửi và người nhận
    loginUser(username: String!, password: String!): User!
    acceptFriend(userSendId: ID!): [User!]!
    logoutUser: User!
  }
  type FriendPayload {
    userSendId: ID!
    userAcceptId: ID!
  }
  type Subscription {
    getListUsers: [User]
    friendRequested: FriendPayload
    loginUser: UserLoginInfo
    friendAccepted: FriendPayload
    logoutUser: UserLogoutInfo
  }

  type UserLoginInfo {
    id: ID!
    status: String!
    timeOnl: Date
  }

  type UserLogoutInfo {
    id: ID!
    status: String!
    timeOnl: Date
  }
`;
