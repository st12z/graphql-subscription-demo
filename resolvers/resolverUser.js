import User from "../models/user.model.js";
import { pubsub, EVENTS } from "../pubsub.js";
import { DateScalar } from "../scalar/graphql-scalar-type.js";
export const resolverUser = {
  Date: DateScalar,
  Query: {
    getListUsers: async () => {
      const users = await User.find();
      return users;
    },
  },
  Mutation: {
    createUser: async (_, { username, password }) => {
      const user = new User({ username, password });
      await user.save();
      const users = await User.find();
      pubsub.publish(EVENTS.MODEL_CREATED, { getListUsers: users });
      return user;
    },
    addFriend: async (_, { userSendId, userAcceptId }) => {
      const user = await User.findOne({ _id: userSendId });
      const friend = await User.findOne({ _id: userAcceptId });
      if (!user || !friend) {
        throw new Error("User or friend not found");
      }
      if (
        !user.isFriends.includes(userAcceptId) &&
        !friend.isFriends.includes(userSendId) &&
        !user.acceptFriends.includes(userAcceptId) &&
        !friend.acceptFriends.includes(userSendId) &&
        !user.requestFriends.includes(userSendId) &&
        !friend.requestFriends.includes(userSendId)
      ) {
        user.requestFriends.push(userAcceptId);
        friend.acceptFriends.push(userSendId);
        await user.save();
        await friend.save();
        pubsub.publish(EVENTS.FRIEND_ADDED, {
          friendRequested: { userSendId, userAcceptId },
        });
        return [user, friend];
      }
    },
    acceptFriend: async (_, { userSendId, userAcceptId }) => {
      const user = await User.findOne({ _id: userSendId });
      const friend = await User.findOne({ _id: userAcceptId });
      if (!user || !friend) {
        throw new Error("User or friend not found");
      }
      if(!user.isFriends.includes(userAcceptId) && !friend.isFriends.includes(userSendId)){
        user.isFriends.push(userAcceptId);
        friend.isFriends.push(userSendId);
        user.requestFriends = user.requestFriends.filter(id => id !== userAcceptId);
        friend.acceptFriends = friend.acceptFriends.filter(id => id !== userSendId);
        await user.save();
        await friend.save();
        pubsub.publish(EVENTS.FRIEND_ADDED, {
          friendAccepted: { userSendId, userAcceptId },
        });
        return [user, friend];
      }
    },
    loginUser: async (_, { username, password }) => {
      const user = await User.findOne({ username, password });
      if (!user) {
        throw new Error("Invalid username or password");
      }
      user.status = "active";
      user.timeOnl = new Date();
      await user.save();
      const users = await User.find({ _id: { $in: user.isFriends || [] } });
      
      pubsub.publish(EVENTS.USER_LOGIN, {
        loginUser: {
          friends: users,
          userLoginId: user.id,
        },
      });
      return user;
    },
  },
  Subscription: {
    getListUsers: {
      subscribe: () => pubsub.asyncIterableIterator(EVENTS.MODEL_CREATED),
    },
    friendRequested: {
      subscribe: (_, { userAcceptId }) =>
        pubsub.asyncIterableIterator(EVENTS.FRIEND_ADDED),
      resolve: (payload, args) => {
        // Chỉ gửi nếu người nhận đúng
        console.log(payload);
        return payload.friendRequested.userAcceptId === args.userAcceptId
          ? payload.friendRequested
          : null;
      },
    },
    friendAccepted: {
      subscribe: (_, { userSendId }) =>
        pubsub.asyncIterableIterator(EVENTS.FRIEND_ADDED),
      resolve: (payload, args) => {
        // Chỉ gửi nếu người nhận đúng
        console.log(payload);
        return payload.friendAccepted.userSendId === args.userSendId
          ? payload.friendAccepted
          : null;
      },

    },
    loginUser: {
      subscribe: (_, { userId }) => pubsub.asyncIterableIterator(EVENTS.USER_LOGIN),
      resolve: (payload, args) => {
        console.log("friends: ",payload.loginUser.friends)
        console.log("userId in args: ",args.userId)
        // Chỉ trả về nếu userId trong args nằm trong danh sách bạn bè của người vừa login
        const isFriend = payload.loginUser.friends.some(
          (friend) => friend.id === args.userId
        );
        console.log(isFriend)
        return isFriend ? payload.loginUser.userLoginId : null;
      },
    },
  },
};
