import mongoose from "mongoose";
const chatSchema =new mongoose.Schema({
  roomChatID: String,
  userSendID: String,
  message: String,
  isRead: { type: Boolean, default: false },
},{
  timestamps:true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
chatSchema.virtual('id').get(function() {
  return this._id.toString();
});
const Chat = mongoose.model("Chat",chatSchema,"chats");
export default Chat;