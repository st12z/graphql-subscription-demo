import { subscribe } from "graphql";
import User from "../models/user.model.js";
import RoomChat from "../models/room_chat.model.js";
import jwt from "jsonwebtoken";
import { pubsub, EVENTS } from "../pubsub.js";
import { DateScalar } from "../scalar/graphql-scalar-type.js";
export const resolverUser = {
  Date: DateScalar,
  Query: {
    getListUsers: async (context) => {
      const users = await User.find();
      return users;
    },
  },
  Mutation: {
    // tạo tài khoản người dùng và publish sự kiện người dùng mới được tạo -> trả về cho subscription danh sách
    // người dùng mới nhất
    createUser: async (_, { username, password }) => {
      const user = new User({ username, password });
      await user.save();
      const users = await User.find();
      pubsub.publish(EVENTS.MODEL_CREATED, { getListUsers: users });
      return user;
    },
    // Thêm bạn bè. Nhận vào 2 tham số userSenđI, userAcceptId.
    // requestFriends của người gửi lưu id người nhận
    // acceptFriends của người nhận lưu id người gửi
    // publish sự kiện đến người nhận -> trả về subscription một object friendRequested gồm userAcceptId, userSendId
    addFriend: async (_, { userAcceptId }, context) => {
      if (!context.userId) {
        throw new Error("Unauthorized");
      }
      const user = await User.findOne({ _id: context.userId });
      const friend = await User.findOne({ _id: userAcceptId });
      if (!user || !friend) {
        throw new Error("User or friend not found");
      }
      if (
        !user.isFriends.includes(userAcceptId) &&
        !friend.isFriends.includes(context.userId) &&
        !user.acceptFriends.includes(userAcceptId) &&
        !friend.acceptFriends.includes(context.userId) &&
        !user.requestFriends.includes(context.userId) &&
        !friend.requestFriends.includes(context.userId)
      ) {
        user.requestFriends.push(userAcceptId);
        friend.acceptFriends.push(context.userId);
        await Promise.all([user.save(), friend.save()]);
        pubsub.publish(`${EVENTS.FRIEND_ADDED}`, {
          friendRequested: { userSendId: context.userId, userAcceptId },
        });
        return [user, friend];
      }
    },
    // Chấp nhận lời mời kết bạn. Chỉ nhận userSendId, userAcceptId lấy từ context.userId
    // isFriends của cả 2 người thêm id của nhau
    // Loại bỏ id của người nhận trong requestFriends của người gửi và id của người gửi trong acceptFriends của người nhận
    // publish sự kiện đến người gửi -> trả về subscription một object friendAccepted gồm userAcceptId, userSendId
    acceptFriend: async (_, { userSendId }, context) => {
      if (!context.userId) {
        throw new Error("Unauthorized: Please login");
      }
      const user = await User.findOne({ _id: userSendId });
      const friend = await User.findOne({ _id: context.userId });
      if (!user || !friend) {
        throw new Error("User or friend not found");
      }
      if (
        !user.isFriends.includes(context.userId) &&
        !friend.isFriends.includes(userSendId)
      ) {
        user.isFriends.push(context.userId);
        friend.isFriends.push(userSendId);
        user.requestFriends = user.requestFriends.filter(
          (id) => id !== context.userId
        );
        friend.acceptFriends = friend.acceptFriends.filter(
          (id) => id !== userSendId
        );
        await Promise.all([user.save(), friend.save()]);

        const [userAID, userBID] = [userSendId, context.userId].sort();
        const roomChat = new RoomChat({
          userAID,
          userBID,
        });
        await roomChat.save();
        console.log("Created RoomChat id:", roomChat.id);
        pubsub.publish(EVENTS.FRIEND_ADDED, {
          friendAccepted: { userSendId, userAcceptId: context.userId },
        });
        return [user, friend];
      }
    },
    // Đăng nhập người dùng. Nhận vào username, password
    // Nếu đúng, thay đổi status thành active, timeOnl thành thời gian hiện tại
    // Tìm danh sách bạn bè của người dùng
    // publish sự kiện đến tất cả bạn bè -> trả về subscription loginUser gồm danh sách bạn bè của người đăng nhập và userLoginId
    loginUser: async (_, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user || user.password !== password) {
        throw new Error("Invalid username or password");
      }
      console.log("User logging in:", user.id);
      user.status = "active";
      user.timeOnl = new Date();
      await user.save();

      const users = await User.find({
        _id: { $in: user.isFriends || [] },
      }).select("id username avatar");

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      users.forEach((friend) => {
        pubsub.publish(`${EVENTS.USER_LOGIN}.${friend.id}`, {
          loginUser: {
            user: { id: user.id, status: user.status, timeOnl: user.timeOnl },
          },
        });
      });

      return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
        timeOnl: user.timeOnl,
        acceptFriends: user.acceptFriends,
        requestFriends: user.requestFriends,
        isFriends: user.isFriends,
        token: token,
      };
    },
    logoutUser: async (_, __, context) => {
      if (!context.userId) throw new Error("Unauthorized");

      const user = await User.findById(context.userId);
      if (!user) throw new Error("User not found");
      user.status = "deactive";
      user.timeOnl = new Date();
      await user.save();

      const friends = await User.find({ _id: { $in: user.isFriends || [] } });
      pubsub.publish(EVENTS.USER_LOGOUT, {
        logoutUser: {
          friends,
          userLogoutId: user.id,
        },
      });
      return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
        timeOnl: user.timeOnl,
        token: null,
      };
    },
  },
  Subscription: {
    // lắng nghe sự kiện người dùng mới được tạo và trả về danh sách người dùng mới nhất
    getListUsers: {
      subscribe: () => pubsub.asyncIterableIterator(EVENTS.MODEL_CREATED),
    },
    // người nhận lắng nghe sự kiện có lời mời kết bạn mới.
    // Kiểm tra userAcceptId trong payload có khớp với userAcceptId trong args không (Đối số là tham số mình truyển lắng nghe ở applo server)

    friendRequested: {
      subscribe: (_, { userAcceptId }) =>
        pubsub.asyncIterableIterator(EVENTS.FRIEND_ADDED),
      resolve: (payload, _, context) => {
        // Chỉ gửi nếu người nhận đúng
        console.log("payload friendRequested: ", payload);
        console.log("context userId: ", context.userId);
        return payload.friendRequested.userAcceptId === context.userId
          ? payload.friendRequested
          : null;
      },
    },
    // người gửi lắng nghe sự kiện lời mời kết bạn được chấp nhận
    friendAccepted: {
      subscribe: () => pubsub.asyncIterableIterator(EVENTS.FRIEND_ADDED),
      resolve: (payload, _, context) => {
        console.log("payload friendAccepted: ", payload);
        console.log("context userId: ", context.userId);
        return payload.friendAccepted.userSendId === context.userId
          ? payload.friendAccepted
          : null;
      },
    },
    // lắng nghe sự kiện có người dùng đăng nhập
    // Kiểm tra xem người hiện tại có phải là bạn bè của người đăng nhập không -> nếu có thì trả về userLoginId

    loginUser: {
      subscribe: async (_, __, context) => {
        const userId = context.userId;
        console.log("Subscription context userId:", userId);
        if (!userId) {
          throw new Error("Unauthorized");
        }
        // user.id ở đây lấy từ token
        return pubsub.asyncIterableIterator(`${EVENTS.USER_LOGIN}.${userId}`);
      },
      resolve: (payload, __, context) => {
        // user.id từ token
        console.log("payload loginUser: ", payload);
        return payload.loginUser.user;
      },
    },
    logoutUser: {
      subscribe: () => pubsub.asyncIterableIterator(EVENTS.USER_LOGOUT),
      resolve: (payload, _, context) => {
        console.log("payload logoutUser: ", payload);
        console.log("context userId: ", context.userId);
        const isFriend = payload.logoutUser.friends.some(
          (friend) => friend.id === context.userId
        );
        return isFriend ? payload.logoutUser.userLogoutId : null;
      },
    },
  },
};
