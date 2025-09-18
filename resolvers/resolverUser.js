import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
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
    // Chấp nhận lời mời kết bạn. Nhận vào 2 tham số userSendId, userAcceptId
    // isFriends của cả 2 người thêm id của nhau
    // Loại bỏ id của người nhận trong requestFriends của người gửi và id của người gửi trong acceptFriends của người nhận
    // publish sự kiện đến người gửi -> trả về subscription một object friendAccepted gồm userAcceptId, userSendId
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
    // Đăng nhập người dùng. Nhận vào username, password
    // Nếu đúng, thay đổi status thành active, timeOnl thành thời gian hiện tại
    // Tìm danh sách bạn bè của người dùng
    // publish sự kiện đến tất cả bạn bè -> trả về subscription loginUser gồm danh sách bạn bè của người đăng nhập và userLoginId
    loginUser: async (_, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user || user.password !== password) {
        throw new Error("Invalid username or password");
      }

      user.status = "active";
      user.timeOnl = new Date();
      await user.save();

      const friends = await User.find({ _id: { $in: user.isFriends || [] } });

      const token = jwt.sign({ userId: user.id }, "secret_key");

      pubsub.publish(EVENTS.USER_LOGIN, {
        loginUser: {
          friends,
          userLoginId: user.id,
        },
      });

      return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        token,
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
      resolve: (payload, args) => {
        // Chỉ gửi nếu người nhận đúng
        console.log(payload);
        return payload.friendRequested.userAcceptId === args.userAcceptId
          ? payload.friendRequested
          : null;
      },
    },
    // người gửi lắng nghe sự kiện lời mời kết bạn được chấp nhận
    // Kiểm tra userSendId trong payload có khớp với userSendId trong args không (Đối số là tham số mình truyển lắng nghe ở applo server)
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
    // lắng nghe sự kiện có người dùng đăng nhập
    // Kiểm tra xem người hiện tại có phải là bạn bè của người đăng nhập không -> nếu có thì trả về userLoginId
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
