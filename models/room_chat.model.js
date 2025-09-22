import mongoose from "mongoose";
const roomChat =new mongoose.Schema({
  userAID: String,
  userBID: String,

},{
  timestamps:true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
roomChat.virtual('id').get(function() {
  return this._id.toString();
});
const RoomChat = mongoose.model("RoomChat",roomChat,"room_chats");
export default RoomChat;