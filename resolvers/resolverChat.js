import Chat from "../models/chat.model.js";
import RoomChat from "../models/room_chat.model.js";
import { pubsub, EVENTS } from "../pubsub.js";
import { DateScalar } from "../scalar/graphql-scalar-type.js";
export const resolveChat = {
  Date: DateScalar,
  Query: {
    getMessages: async (_, { roomChatID }, { userId }) => {
      if (!userId) throw new Error('Unauthorized');
      const room = await RoomChat.findOne({ _id: roomChatID });
      if (!room || (room.userAID !== userId && room.userBID !== userId)) {
        throw new Error('Not member of room');
      }
      return await Chat.find({ roomChatID }).sort({ createdAt: 1 });
    },
  },
  Mutation: {
    sendMessage: async (_, { roomChatID, message }, { userId }) => {
      if (!userId) throw new Error('Unauthorized');
      const room = await RoomChat.findOne({ _id: roomChatID });
      if (!room || (room.userAID !== userId && room.userBID !== userId)) {
        throw new Error('Not member of room');
      }
      const newChat = new Chat({ roomChatID, userSendID: userId, message });
      await newChat.save();
      pubsub.publish(EVENTS.MESSAGE_SENT, { newMessage: newChat, roomChatID });
      return newChat;
    },
  },
  Subscription: {
    newMessage: {
      subscribe: (_, { roomChatID }) =>
        pubsub.asyncIterableIterator(EVENTS.MESSAGE_SENT),
      resolve: (payload, args) =>
        payload.roomChatID === args.roomChatID ? payload.newMessage : null,
    },
  },
};
