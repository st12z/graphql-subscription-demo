import { subscribe } from "graphql";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { pubsub } from "../pubsub/index.js";
import { EVENTS } from "../pubsub/event.js";
import { DateScalar } from "../scalar/graphql-scalar-type.js";
import { ttlAsyncIterator } from "../utils/subscriptionHelper.js";
import { checkThrottle } from "../utils/rateLimiter.js";
import { compressPayload, decompressPayload } from "../utils/compress.js";
import { withSubscriptionLimit } from "../utils/subscriptionLimit.js";
import { batchPublish } from "../benmark/batch.js";
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
      const exstUser = await User.findOne({ username });
      if (exstUser) {
        throw new Error("Username already exists");
      }
      const user = new User({ username, password });
      await user.save();
      // const users = await User.find();
      const compressedUsers = compressPayload([user]);
      batchPublish(pubsub, EVENTS.MODEL_CREATED, compressedUsers);
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
        !user.requestFriends.includes(userAcceptId) &&
        !friend.requestFriends.includes(context.userId)
      ) {
        user.requestFriends.push(userAcceptId);
        friend.acceptFriends.push(context.userId);
        await Promise.all([user.save(), friend.save()]);
        pubsub.publish(`${EVENTS.FRIEND_REQUESTED}.${userAcceptId}`, {
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
      const user = await User.findOne({ _id: context.userId });
      const friend = await User.findOne({ _id: userSendId });

      if (!user || !friend) {
        throw new Error("User or friend not found");
      }
      if (
        !user.isFriends.includes(friend.id) &&
        !friend.isFriends.includes(user.id) &&
        user.acceptFriends.includes(friend.id) &&
        friend.requestFriends.includes(user.id)
      ) {
        user.isFriends.push(friend.id);
        friend.isFriends.push(user.id);
        user.acceptFriends = user.acceptFriends.filter(
          (id) => id !== friend.id
        );
        friend.requestFriends = friend.requestFriends.filter(
          (id) => id !== user.id
        );
        await Promise.all([user.save(), friend.save()]);

        pubsub.publish(`${EVENTS.FRIEND_ACCEPTED}.${userSendId}`, {
          friendAccepted: {
            userSendId: userSendId,
            userAcceptId: context.userId,
          },
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

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "5h",
      });
      pubsub.publish(EVENTS.USER_LOGIN, {
        loginUser: {
          friendsIds: user.isFriends,
          user: { id: user.id, status: user.status, timeOnl: user.timeOnl },
        },
      });
      console.log("Listed friendsIds:", user.isFriends);
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
      user.timeOff = new Date();
      await user.save();

      pubsub.publish(EVENTS.USER_LOGOUT, {
        logoutUser: {
          friendsIds: user.isFriends,
          user: { id: user.id, status: user.status, timeOnl: user.timeOnl },
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
      subscribe: withSubscriptionLimit(async (_, __, context) => {
        console.log(
          "Subscription getListUsers context userId:",
          context.userId
        );
        return pubsub.asyncIterableIterator(EVENTS.MODEL_CREATED);
      }),
      resolve: (payload) => {
        if (payload.batched) {
          try {
            const raw = payload.batched.map(decompressPayload).flat();
            const decompressed = raw.filter(Boolean);
            return decompressed;
          } catch (err) {
            console.error("Error during decompression:", err);
          }
        }
        const users = decompressPayload(payload.getListUsers);
        console.log("Received payload for getListUsers:", users);
        return users;
      },
    },
    // người nhận lắng nghe sự kiện có lời mời kết bạn mới.
    // Kiểm tra userAcceptId trong payload có khớp với userAcceptId trong args không (Đối số là tham số mình truyển lắng nghe ở applo server)

    friendRequested: {
      subscribe: async (_, __, context) => {
        console.log(
          "Subscription friendRequested userAcceptId:",
          context.userId
        );
        return pubsub.asyncIterableIterator(
          `${EVENTS.FRIEND_REQUESTED}.${context.userId}`
        );
      },

      resolve: (payload, _, context) => {
        // Chỉ gửi nếu người nhận đúng
        console.log("payload friendRequested: ", payload);
        console.log("context userId: ", context.userId);
        return payload.friendRequested;
      },
    },
    // người gửi lắng nghe sự kiện lời mời kết bạn được chấp nhận
    friendAccepted: {
      subscribe: async (_, __, context) => {
        console.log("Subscription friendAccepted userSendId: ", context.userId);
        return pubsub.asyncIterableIterator(
          `${EVENTS.FRIEND_ACCEPTED}.${context.userId}`
        );
      },

      resolve: (payload, _, context) => {
        console.log("payload friendAccepted: ", payload);
        console.log("context userId: ", context.userId);
        return payload.friendAccepted;
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
        checkThrottle(userId);
        // user.id ở đây lấy từ token
        return ttlAsyncIterator(pubsub, EVENTS.USER_LOGIN, 1 * 60 * 1000);
      },
      resolve: (payload, __, context) => {
        // user.id từ token
        console.log("payload loginUser: ", payload);
        return payload.loginUser.friendsIds.includes(context.userId)
          ? payload.loginUser.user
          : null;
      },
    },
    logoutUser: {
      subscribe: async (_, __, context) => {
        const userId = context.userId;
        console.log("Subscription context userId:", userId);
        if (!userId) {
          throw new Error("Unauthorized");
        }
        checkThrottle(userId);
        // user.id ở đây lấy từ token
        return ttlAsyncIterator(pubsub, EVENTS.USER_LOGOUT, 1 * 60 * 1000);
      },
      resolve: (payload, __, context) => {
        console.log("payload logoutUser: ", JSON.stringify(payload));
        console.log("context userId: ", context.userId);
        return payload.logoutUser.friendsIds.includes(context.userId)
          ? payload.logoutUser.user
          : null;
      },
    },
  },
};
